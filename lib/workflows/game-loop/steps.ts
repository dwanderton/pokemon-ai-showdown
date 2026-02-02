'use server';

import { generateObject } from 'ai';
import { z } from 'zod';
import type { 
  AIDecision, 
  GameState, 
  GameLoopInput, 
  GameLoopOutput,
  AgentPersonality,
  ModelId,
  GBAButton
} from '@/lib/types/agent';
import { AGENT_PERSONALITIES } from '@/lib/types/agent';
import { 
  CONTROL_NOTES, 
  GAMER_INTELLIGENCE_RULES, 
  formatCommandHistory 
} from '@/lib/game-knowledge';
import { getMemStashForPrompt, appendMemStash, appendDecisionLog } from '@/lib/memstash';

// Screen type analysis schema - first step, lightweight
const screenTypeSchema = z.object({
  screenType: z.enum(['overworld', 'battle', 'menu', 'dialogue', 'textEntry', 'transition', 'unknown']),
  briefDescription: z.string(), // Player position relative to visible elements
});

// Screen analysis step - runs FIRST, determines screen type only
export async function analyzeScreenType(input: { modelId: ModelId; frame: string }): Promise<{
  screenType: 'overworld' | 'battle' | 'menu' | 'dialogue' | 'textEntry' | 'transition' | 'unknown';
  briefDescription: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> {
  'use step';
  
  const startTime = Date.now();
  console.log(`[workflow:step:analyzeScreenType] Starting`, { modelId: input.modelId });
  
  try {
    const result = await generateObject({
      model: input.modelId,
      schema: screenTypeSchema,
      messages: [
        {
          role: 'system',
          content: `You are analyzing a Pokemon LeafGreen game screen. Identify ONLY the screen type.

Screen types:
- **overworld**: Player walking around, exploration, towns, routes, buildings
- **battle**: Pokemon battle in progress (wild or trainer)
- **menu**: START menu, bag, Pokemon party, options, save screen
- **dialogue**: Text box visible with NPC/sign text, story dialogue
- **textEntry**: Naming screen (Pokemon, player name) with letter grid
- **transition**: Screen fade, loading, or animation between areas
- **unknown**: Cannot determine

Respond with the screen type and a short description of where the player is in relation to all of the other visible elements on the screen.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What type of screen is this?' },
            { type: 'image', image: input.frame },
          ],
        },
      ],
      maxOutputTokens: 100,
      experimental_telemetry: { isEnabled: false },
      abortSignal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    console.log(`[workflow:step:analyzeScreenType] Complete`, {
      duration: Date.now() - startTime,
      screenType: result.object.screenType,
      tokens: result.usage?.totalTokens,
    });
    
    return {
      screenType: result.object.screenType,
      briefDescription: result.object.briefDescription,
      usage: {
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  } catch (error) {
    console.error(`[workflow:step:analyzeScreenType] Failed`, {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      screenType: 'unknown',
      briefDescription: 'Failed to analyze screen',
      usage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
    };
  }
}

// Confidence scores schema - one for each button
const confidenceScoresSchema = z.object({
  A: z.number().min(0).max(1),
  B: z.number().min(0).max(1),
  START: z.number().min(0).max(1),
  SELECT: z.number().min(0).max(1),
  UP: z.number().min(0).max(1),
  DOWN: z.number().min(0).max(1),
  LEFT: z.number().min(0).max(1),
  RIGHT: z.number().min(0).max(1),
  L: z.number().min(0).max(1),
  R: z.number().min(0).max(1),
  WAIT: z.number().min(0).max(1),
});

// Simplified schema for AI decision - model returns confidence for each button, frontend picks highest
// Now supports sequences: array of confidence dictionaries for chained inputs
const decisionSchema = z.object({
  screenAnalysis: z.string(), // Description of what's visible on screen (player, NPCs, objects, exits, etc.)
  reasoning: z.string(),
  personality_comment: z.string().nullable().optional().default(''), // Optional - can be empty/null to avoid repetition
  // Array of confidence scores - first is required, additional steps executed only if confidence >= 0.85
  buttonSequence: z.array(confidenceScoresSchema).min(1), // No max limit - stop parsing when confidence drops
  progressConfidence: z.number().min(0).max(1), // 0-1: Do you feel your previous actions got you closer to your goals?
  // Structured notes - persistent state the AI maintains
  notes: z.object({
    currentObjective: z.string().nullable().optional(), // What are you trying to do right now?
    lastKnownLocation: z.string().nullable().optional(), // Where were you last?
    exitFound: z.string().nullable().optional(), // Direction of exit if found (e.g., "LEFT wall has door")
    stuckMode: z.enum(['none', 'perimeter_scan', 'wall_hug', 'backtrack']).nullable().optional(), // Current recovery strategy
    failedAttempts: z.array(z.string()).max(5).nullable().optional(), // Last 5 failed actions with context
    importantDiscovery: z.string().nullable().optional(), // Something important to remember
    general: z.string().nullable().optional(), // Free-form notes for anything else the AI wants to track
  }).nullable().optional(),
  });

// Simplified game state schema - all optional with defaults
const gameStateSchema = z.object({
  currentArea: z.string().optional().default('Unknown'),
  inBattle: z.boolean().optional().default(false),
  inMenu: z.boolean().optional().default(false),
  inDialogue: z.boolean().optional().default(false),
  inTextEntry: z.boolean().optional().default(false),
  pokemonCount: z.number().optional().default(0),
  badges: z.number().optional().default(0),
  screenType: z.enum(['overworld', 'battle', 'menu', 'dialogue', 'textEntry', 'transition', 'unknown']).optional().default('unknown'),
  // Party health estimate (0-100 percent)
  estimatedPartyHP: z.number().min(0).max(100).optional().default(100),
});

import { createInitialGameState, DEFAULT_PROGRESS_METRICS } from '@/lib/types/agent';

// Default fallback decision when schema fails
// We estimate tokens for fallback because the API call DID happen and consume tokens
// Even though parsing failed, we still need to track the cost
// Uses WAIT instead of A to avoid accidentally triggering unwanted actions
const createFallbackDecision = (estimatedPromptTokens = 1500): GameLoopOutput => ({
  decision: {
    button: 'WAIT',
    reasoning: 'Fallback: waiting due to parsing error - no action taken',
    confidence: 0.5,
    personality_comment: '',
    confidenceScores: { A: 0.2, B: 0.2, START: 0.1, SELECT: 0.1, UP: 0.2, DOWN: 0.2, LEFT: 0.2, RIGHT: 0.2, L: 0.1, R: 0.1, WAIT: 0.5 },
    progressConfidence: 0.3,
    buttonSequence: [{ button: 'WAIT', confidence: 0.5 }], // Single WAIT fallback - safe default
    timestamp: Date.now(),
    isFallback: true,
  },
  gameState: createInitialGameState(),
  // Estimate ~1500 prompt tokens (image + system prompt) and ~100 completion tokens
  usage: { promptTokens: estimatedPromptTokens, completionTokens: 100, totalTokens: estimatedPromptTokens + 100 },
});

async function getPersonalityPrompt(personality: AgentPersonality): Promise<string> {
  const styleGuides: Record<string, string> = {
    emiru: `You are Pokemon AI Showdown, a wholesome and enthusiastic Pokemon player. 
      - React with genuine excitement to cute Pokemon and good catches
      - Use expressions like "omg", "so cute!!", "let's gooo"
      - Get emotionally invested in your Pokemon team
      - Celebrate small victories warmly`,
    
    asmongold: `You are Asmon, a veteran gamer who takes Pokemon seriously.
      - Be blunt and strategic about decisions
      - Complain about bad RNG and unfair mechanics
      - Reference min-maxing and optimal strategies
      - Use expressions like "dude", "that's actually insane", "classic"`,
    
    jerma: `You are Jerms, a chaotic and unpredictable Pokemon player.
      - Make weird observations about the game world
      - Reference obscure strategies that may or may not work
      - Be dramatic about mundane events
      - Occasionally question your own decisions`,
    
    ludwig: `You are Lud, a competitive Pokemon player focused on stats.
      - Trash talk other AI players
      - Focus on efficiency and speed
      - Reference speedrun strategies
      - Use expressions like "actually", "technically", "let's be real"`,
    
    pokimane: `You are Poki, an encouraging and methodical player.
      - Celebrate small wins and progress
      - Stay positive even when things go wrong
      - Explain your thinking clearly
      - Be supportive of your Pokemon team`,
    
    xqc: `You are X, a fast-paced speedrun-focused player.
      - Be impatient with slow dialogue and cutscenes
      - Focus on going fast and skipping optional content
      - Use rapid-fire commentary
      - Get frustrated with delays but stay determined`,
  };

  return styleGuides[personality.style] || styleGuides.emiru;
}

export async function analyzeFrameAndDecide(input: GameLoopInput): Promise<GameLoopOutput> {
  'use step';
  
  const operationId = Math.random().toString(36).slice(2, 10);
  console.log(`[workflow:step:analyzeFrameAndDecide] Starting`, { 
    operationId, 
    agentId: input.agentId, 
    modelId: input.modelId,
    frameSize: input.frame?.length || 0,
  });
  const startTime = Date.now();
  
  const personality = AGENT_PERSONALITIES[input.agentId] || AGENT_PERSONALITIES['agent-1'];
  const personalityPrompt = await getPersonalityPrompt(personality);

  const systemPrompt = `You are an AI playing Pokemon LeafGreen. Your goal is to become the Pokemon Champion.

${personalityPrompt}

## PRIMARY GOAL
YOUR MAIN GOAL IS TO EXPLORE THE WORLD. Discover new areas, find exits, interact with NPCs and objects, and map out each location thoroughly.

## Game Controls
- Press A to confirm/select, B to cancel/back, START for menu
- D-pad (UP/DOWN/LEFT/RIGHT) for movement and menu navigation ONLY
- ${CONTROL_NOTES.directionalKeysOnly}
- ${CONTROL_NOTES.waitOption}
- ${CONTROL_NOTES.blackAreasInsideBuildings}
- ${CONTROL_NOTES.textEntryNavigation}
- ${CONTROL_NOTES.interactionVsTraversal}
- ${CONTROL_NOTES.facingThenMoving}
- ${CONTROL_NOTES.doorsAndStairs}

## Visual Interpretation Warning
${CONTROL_NOTES.visualInterpretationWarning}

## Game Knowledge
- Pokemon LeafGreen is a GBA game where you catch, train, and battle Pokemon
- The goal is to collect 8 gym badges and defeat the Elite Four
- In battles: A to select move, B to go back, arrows to navigate moves/options

## Gamer Intelligence Rules (CRITICAL - avoid these mistakes)
${GAMER_INTELLIGENCE_RULES.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

## Screen Analysis (screenAnalysis field)
Describe ONLY what you see on screen. Do NOT suggest actions or next moves in this field.
- List ALL visible items/objects and their approximate location (top-left, center, bottom-right, etc.)
- Identify: player position, NPCs, doors/exits, stairs, items on ground, interactable objects
- BLACK AREAS are WALLS - treat any black/dark regions as impassable obstacles
- DARK AREAS ARE NEVER STAIRS - stairs are visible tile graphics, not darkness
- Note any text, dialog boxes, or menu elements
- Be factual and specific: "Player center-left. NPC top-right. Door on left wall. Black wall covering bottom half."

## Decision Making (reasoning field)
1. Analyze the current screen state (battle, overworld, menu, dialogue)
2. Consider your recent actions - look for patterns of repetition
3. Make a decision that helps you explore more
4. Stay in character with your personality
5. If you choose WAIT, you may omit the personality_comment

## Structured Notes
You have access to persistent Notes stored as a structured object. Update any field that changes:
- **currentObjective**: What are you trying to do? (e.g., "Find exit to Route 1", "Defeat Brock")
- **lastKnownLocation**: Where are you? (e.g., "Pallet Town - Oak's Lab", "Route 1 - north section")
- **exitFound**: If you found an exit, note direction (e.g., "Exit is on LEFT wall", "Door found BOTTOM")
- **stuckMode**: If stuck, set to 'perimeter_scan', 'wall_hug', or 'backtrack'. Set to 'none' when unstuck.
- **failedAttempts**: Array of last 5 failed actions (e.g., ["UP - wall", "LEFT x3 - blocked", "A - no effect"])
- **importantDiscovery**: Anything critical to remember (e.g., "NPC blocks path until badge", "Hidden item in corner")
- **general**: Free-form notes for anything else you want to track (strategy, patterns noticed, etc.)

Only include fields you want to update. Previous values persist if not overwritten.

## Visual Interpretation Warning
Do NOT fully trust your visual interpretation of the room and its contents. GBA graphics can be ambiguous - what looks like a path might be a wall, what looks like an NPC might be decoration. If your action has no effect, reconsider your interpretation.

## Important
- IF THERE IS TEXT/DIALOG ON SCREEN: Only A or B will dismiss it. Movement keys (UP/DOWN/LEFT/RIGHT) will have NO EFFECT until the dialog is dismissed. Press A to advance or B to close.
- If in dialogue and text is STILL APPEARING/ANIMATING, use WAIT to let it finish before pressing A
- If dialogue is complete (text stopped), press A to advance or B to close
- AFTER DIALOG ENDS: Do NOT press the direction toward whatever you were facing (NPC/sign). This will re-trigger the dialog. Move AWAY (perpendicular or opposite direction) first.
- If in battle, consider type advantages and Pokemon health
- If stuck: USE YOUR NOTES to track what you've tried. Switch to PERIMETER SCAN or WALL HUG.
- DOWN DOES NOT GUARANTEE EXIT. Doors can be on ANY wall. Check the ENTIRE perimeter.
- Focus on exploring and discovering new areas
- Explore rooms by interacting with objects (press A on bookshelves, PCs, NPCs)
- Use WAIT when the game is in an animation, loading, or when you need to observe before acting`;

  // Use the detailed command history with change indicators if provided
  const commandHistoryText = input.commandHistoryWithChanges || formatCommandHistory(input.previousDecisions || [], 25);
  
  // Single image - current frame only
  // Include pre-analyzed screen type if available
  const screenTypeContext = input.screenTypeAnalysis
    ? `\n\n## PRE-ANALYZED SCREEN TYPE\nScreen type: **${input.screenTypeAnalysis.screenType}**\nDescription: ${input.screenTypeAnalysis.briefDescription}\n\nUse this analysis to inform your decision. The screen type has already been determined by a previous analysis step.`
    : '';
  const imageContextDescription = `You are being shown the current game screen.${screenTypeContext}`;
  
  // Format previous confidence scores for the prompt
  const prevScoresText = input.previousConfidenceScores 
    ? `Previous confidence scores (adjusted for ineffective actions): ${JSON.stringify(input.previousConfidenceScores)}`
    : 'No previous confidence scores (first decision)';
  
  // Format dialog history to avoid repetition
  const dialogHistoryText = input.previousDialogHistory && input.previousDialogHistory.length > 0
    ? `Your recent comments (DO NOT REPEAT THESE):\n${input.previousDialogHistory.map((d, i) => `${i + 1}. "${d}"`).join('\n')}`
    : '';
  
  // Warnings for button spam prevention
  const avoidStartSelectWarning = input.avoidStartSelect
    ? '\n\n**WARNING: You have pressed START or SELECT more than 2 times in a row. DO NOT press START or SELECT again this turn. Try a different action like A, B, or a direction.**'
    : '';
  const avoidWaitWarning = input.avoidWait
    ? '\n\n**WARNING: You have used WAIT 3 times in a row. Something should be happening on screen. Press A to advance, or try a different action.**'
    : '';
  const avoidBWarning = input.avoidB
    ? '\n\n**WARNING: You have pressed B 5 times in a row. If you are trying to exit something, try pressing A instead, or move in a direction.**'
    : '';
  const buttonsToAvoidWarning = input.buttonsToAvoid && input.buttonsToAvoid.length > 0
    ? `\n\n**SUGGESTION: These buttons had NO EFFECT recently and you should probably NOT press them: ${input.buttonsToAvoid.join(', ')}. Try a different action.**`
    : '';
  const bannedButtonsWarning = input.bannedButtons && input.bannedButtons.length > 0
    ? `\n\n**BANNED BUTTONS: You have pressed these buttons 10+ times: ${input.bannedButtons.join(', ')}. DO NOT press these buttons for the next 2 prompts. Try a completely different approach.**`
    : '';
  
  // Check if model mentioned "stuck" in previous reasoning - add stuck recovery protocol
  const previousMentionedStuck = input.previousDecisions?.slice(-3).some(d => 
    d.reasoning.toLowerCase().includes('stuck') || d.reasoning.toLowerCase().includes('blocked')
  );
  const stuckRecoveryNotes = previousMentionedStuck
    ? `\n\n## STUCK RECOVERY PROTOCOL (you mentioned being stuck)\n${CONTROL_NOTES.stuckRecovery}\n\n${CONTROL_NOTES.wallHugNavigation}\n\n${CONTROL_NOTES.perimeterScan}`
    : '';
  
  // Check for repeated same button presses (8+ of same button in last 10)
  const recentButtons = input.previousDecisions?.slice(-10).map(d => d.button) || [];
  const lastButton = recentButtons[recentButtons.length - 1];
  const sameButtonCount = lastButton ? recentButtons.filter(b => b === lastButton).length : 0;
  const repeatedButtonWarning = sameButtonCount >= 8
    ? `\n\n**WARNING: You have pressed ${lastButton} ${sameButtonCount} times in the last 10 moves. This pattern is likely not making progress. Try a DIFFERENT action or direction. If exploring, switch to a different wall or rotation direction.**`
    : '';
  
  // Prefix with Notes if available
  const notesPrefix = input.notes 
    ? `## Your Notes\n${input.notes}\n\n---\n\n` 
    : '';
  
  const userPrompt = `${notesPrefix}${imageContextDescription}${avoidStartSelectWarning}${avoidWaitWarning}${avoidBWarning}${buttonsToAvoidWarning}${bannedButtonsWarning}${stuckRecoveryNotes}${repeatedButtonWarning}

Previous state: ${input.previousState ? JSON.stringify(input.previousState) : 'None (game just started)'}

Command history with visual change detection (last 25):
${commandHistoryText}

NOTE: [SCREEN CHANGED] means the screen visually changed after that button press. [NO CHANGE] means the screen looked the same. Use this to identify which actions are having an effect!

${prevScoresText}

${dialogHistoryText}

Recent reasoning (last 3):
${input.previousDecisions?.slice(-3).map(d => `- ${d.button}: ${d.reasoning}`).join('\n') || 'None yet'}

Analyze the CURRENT screen (the last/most recent image) and provide:
1. Your analysis of the current game state
2. Your reasoning for what action should be taken
3. An in-character PERSONALITY COMMENT: ONLY provide a comment when something NEW or EXCITING happens (defeating a gym leader, catching a Pokemon, discovering a new area, funny situation). For routine actions (walking, menu navigation, advancing dialogue), leave this EMPTY. Avoid commentary that doesn't add value.
4. A BUTTON SEQUENCE: An array of 1-5 confidence dictionaries. Each has scores 0-1 for (A, B, START, SELECT, UP, DOWN, LEFT, RIGHT, L, R, WAIT).
   - The system executes the button with highest confidence from each step
   - Steps 2-5 only execute if their highest confidence is >= 0.85
   - Use sequences for predictable chains like: walking multiple tiles, advancing dialogue (A,A,A), menu navigation
5. Your PROGRESS CONFIDENCE (0-1): Are your actions getting you closer to becoming Champion? 0=stuck, 1=definite progress`;

  try {
    console.log(`[workflow:step:analyzeFrameAndDecide] Calling generateObject`, {
      operationId,
      model: input.modelId,
      hasFrame: !!input.frame,
    });

    // Send only current frame - single image
    const imageContent: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
      { type: 'text', text: userPrompt },
      { type: 'image', image: input.frame },
    ];

    const result = await generateObject({
      model: input.modelId,
      schema: z.object({
        gameState: gameStateSchema,
        decision: decisionSchema,
      }),
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: imageContent,
        },
      ],
      maxOutputTokens: 1000,
      experimental_telemetry: { isEnabled: false },
      abortSignal: AbortSignal.timeout(60000), // 60 second timeout for main analysis
    });

    const duration = Date.now() - startTime;
    
    // Get first button sequence scores for logging
    const firstStepScores = result.object.decision.buttonSequence?.[0] || {};
    console.log(`[workflow:step:analyzeFrameAndDecide] Complete`, {
      operationId,
      duration,
      topConfidenceScores: Object.entries(firstStepScores)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3),
      progressConfidence: result.object.decision.progressConfidence,
      tokensUsed: result.usage?.totalTokens,
    });

    // Map simplified schema to full GameState type with RL-based fields
    const gameState: GameState = {
      currentArea: result.object.gameState.currentArea ?? 'Unknown',
      inBattle: result.object.gameState.inBattle ?? false,
      inMenu: result.object.gameState.inMenu ?? false,
      inDialogue: result.object.gameState.inDialogue ?? false,
      inTextEntry: result.object.gameState.inTextEntry ?? false,
      pokemonCount: result.object.gameState.pokemonCount ?? 0,
      partyHealth: [],
      party: [], // Will be populated if we can read memory
      totalPartyHP: result.object.gameState.estimatedPartyHP ?? 100,
      badges: result.object.gameState.badges ?? 0,
      playtime: '0:00',
      currentMilestone: null,
      progressMetrics: { ...DEFAULT_PROGRESS_METRICS, locationsThisEpisode: new Set() },
      lastAction: null,
      lastActionResult: '',
      screenType: result.object.gameState.screenType ?? 'unknown',
    };

    // Process button sequence - pick highest confidence button from each step
    const buttonSequence = result.object.decision.buttonSequence;
    const SEQUENCE_THRESHOLD = 0.85;
    
    // Validate buttonSequence exists and is an array
    if (!buttonSequence || !Array.isArray(buttonSequence) || buttonSequence.length === 0) {
      console.warn(`[workflow:step:analyzeFrameAndDecide] Invalid buttonSequence, using fallback`);
      return createFallbackDecision();
    }
    
    // Build the sequence of buttons to execute
    const buttonsToExecute: Array<{ button: string; score: number }> = [];
    
    for (let i = 0; i < buttonSequence.length; i++) {
      const scores = buttonSequence[i];
      
      // Skip if scores is null/undefined or not an object
      if (!scores || typeof scores !== 'object') {
        console.warn(`[workflow:step:analyzeFrameAndDecide] Invalid scores at index ${i}, skipping`);
        continue;
      }
      
      const entries = Object.entries(scores) as [string, number][];
      if (entries.length === 0) {
        console.warn(`[workflow:step:analyzeFrameAndDecide] Empty scores at index ${i}, skipping`);
        continue;
      }
      
      const best = entries.reduce((b, [btn, score]) => {
        const numScore = typeof score === 'number' ? score : 0;
        return numScore > b.score ? { button: btn, score: numScore } : b;
      }, { button: 'A', score: -1 });
      
      // First button always executes, subsequent only if confidence >= threshold
      if (buttonsToExecute.length === 0 || best.score >= SEQUENCE_THRESHOLD) {
        buttonsToExecute.push(best);
      } else {
        break; // Stop sequence when confidence drops below threshold
      }
    }
    
    // Ensure we have at least one button
    if (buttonsToExecute.length === 0) {
      // console.warn(`[workflow:step:analyzeFrameAndDecide] No valid buttons in sequence, using fallback`);
      return createFallbackDecision();
    }
    
    const primaryButton = buttonsToExecute[0];
    const firstScores = buttonSequence[0] || {};
    
    // console.log(`[workflow:step:analyzeFrameAndDecide] Button sequence: ${buttonsToExecute.map(b => `${b.button}(${b.score.toFixed(2)})`).join(' -> ')}`);

    // Handle structured notes - merge if model provided new content
    if (result.object.decision.notes && typeof result.object.decision.notes === 'object') {
      await appendMemStash(input.agentId, result.object.decision.notes);
    }
    
    // Log decision to persistent decision log
    await appendDecisionLog(input.agentId, {
      button: primaryButton.button,
      reasoning: result.object.decision.reasoning,
    });

return {
  decision: {
  button: primaryButton.button,
  reasoning: result.object.decision.reasoning,
  screenAnalysis: result.object.decision.screenAnalysis,
  confidence: primaryButton.score,
  personality_comment: result.object.decision.personality_comment,
  confidenceScores: firstScores, // First step's confidence scores
  progressConfidence: result.object.decision.progressConfidence,
  buttonSequence: buttonsToExecute.map(b => ({ button: b.button, confidence: b.score })), // Full sequence to execute
  timestamp: Date.now(),
  isFallback: false,
  } as AIDecision,
      gameState,
      usage: {
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    // console.error(`[workflow:step:analyzeFrameAndDecide] Failed`, { operationId, duration: Date.now() - startTime, errorName, error: errorMessage });
    
    // Always return fallback decision on any AI error - don't crash the game loop
    // console.log(`[workflow:step:analyzeFrameAndDecide] Using fallback decision due to error: ${errorName}`);
    return createFallbackDecision();
  }
}

// Cost calculation based on model pricing (approximate)
const MODEL_COSTS: Record<ModelId, { input: number; output: number }> = {
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  'openai/gpt-4.1': { input: 0.002, output: 0.008 },
  'anthropic/claude-sonnet-4': { input: 0.003, output: 0.015 },
  'anthropic/claude-opus-4': { input: 0.015, output: 0.075 },
  'google/gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'google/gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'xai/grok-3': { input: 0.003, output: 0.015 },
  'xai/grok-3-mini': { input: 0.0003, output: 0.0005 },
};

export async function calculateCost(
  modelId: ModelId, 
  promptTokens: number, 
  completionTokens: number
): Promise<number> {
  const costs = MODEL_COSTS[modelId] || { input: 0.003, output: 0.015 };
  return (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
}
