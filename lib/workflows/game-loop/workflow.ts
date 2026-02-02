import { analyzeScreenType, analyzeFrameAndDecide, calculateCost } from './steps';
import type { 
  AIDecision, 
  AgentState, 
  GameLoopInput, 
  GameState,
  ModelId,
  ProgressMetrics
} from '@/lib/types/agent';
import { AGENT_PERSONALITIES, DEFAULT_PROGRESS_METRICS, createInitialGameState } from '@/lib/types/agent';
import { calculateNavigationReward, detectStuckState } from '@/lib/game-knowledge';

export interface GameLoopWorkflowInput {
  agentId: string;
  modelId: ModelId;
  frame: string;
  previousFrames?: string[];
  commandHistoryWithChanges?: string;
  previousConfidenceScores?: Record<string, number>;
  previousDialogHistory?: string[];
  avoidStartSelect?: boolean;
}

export interface GameLoopWorkflowOutput {
  decision: AIDecision;
  gameState: GameState;
  updatedAgentState: Partial<AgentState>;
  cost: number;
}

// Single iteration of the game loop - called from API route
export async function gameLoopIteration(
  input: GameLoopWorkflowInput,
  currentState?: AgentState
): Promise<GameLoopWorkflowOutput> {
  'use workflow';

  // console.log(`[workflow:gameLoopIteration] Starting iteration`, { agentId: input.agentId, modelId: input.modelId });

  const personality = AGENT_PERSONALITIES[input.agentId] || AGENT_PERSONALITIES['agent-1'];

  // STEP 1: Analyze screen type first (lightweight, fast)
  const screenTypeResult = await analyzeScreenType({
    modelId: input.modelId,
    frame: input.frame,
  });

  // Prepare input for the AI step, including pre-analyzed screen type
  const loopInput: GameLoopInput = {
    agentId: input.agentId,
    modelId: input.modelId,
    frame: input.frame,
    previousFrames: input.previousFrames,
    commandHistoryWithChanges: input.commandHistoryWithChanges,
    previousConfidenceScores: input.previousConfidenceScores,
    previousDialogHistory: input.previousDialogHistory,
    avoidStartSelect: input.avoidStartSelect,
    previousState: currentState?.gameState,
    previousDecisions: currentState?.decisions.slice(-5),
    // Pass the pre-analyzed screen type
    screenTypeAnalysis: {
      screenType: screenTypeResult.screenType,
      briefDescription: screenTypeResult.briefDescription,
    },
  };

  // STEP 2: Execute the main AI analysis step with screen type context
  const result = await analyzeFrameAndDecide(loopInput);

  // Calculate cost for this iteration (includes both steps)
  const totalPromptTokens = screenTypeResult.usage.promptTokens + result.usage.promptTokens;
  const totalCompletionTokens = screenTypeResult.usage.completionTokens + result.usage.completionTokens;
  const cost = await calculateCost(
    input.modelId,
    totalPromptTokens,
    totalCompletionTokens
  );

  // Check for badge progress
  const previousBadges = currentState?.badges ?? 0;
  const newBadges = result.gameState.badges;
  const badgeEarned = newBadges > previousBadges;

  // Preserve currentArea - don't let it revert to "Unknown" once set
  const newArea = (result.gameState.currentArea === 'Unknown' && currentState?.gameState?.currentArea && currentState.gameState.currentArea !== 'Unknown')
    ? currentState.gameState.currentArea
    : result.gameState.currentArea;
  
  // Update progress metrics (RL-based tracking)
  const prevMetrics = currentState?.gameState?.progressMetrics || { ...DEFAULT_PROGRESS_METRICS, locationsThisEpisode: new Set() };
  const newMetrics: ProgressMetrics = {
    ...prevMetrics,
    locationsThisEpisode: new Set(prevMetrics.locationsThisEpisode),
  };
  
  // Track navigation (new location discovery)
  if (newArea !== 'Unknown') {
    const navResult = calculateNavigationReward(newArea, newMetrics.locationsThisEpisode);
    if (navResult.isNew) {
      newMetrics.locationsThisEpisode.add(newArea);
      newMetrics.uniqueLocationsVisited = newMetrics.locationsThisEpisode.size;
      if (!newMetrics.areasDiscovered.includes(newArea)) {
        newMetrics.areasDiscovered.push(newArea);
      }
    }
  }
  
  // Track stuck detection based on recent decisions
  const recentActions = currentState?.decisions.slice(-5).map(d => d.button) || [];
  const stuckInfo = detectStuckState(
    newMetrics.consecutiveNoChangeCount,
    recentActions
  );
  
  // if (stuckInfo.isStuck) {
  //   console.log(`[workflow:gameLoopIteration] Agent appears stuck: ${stuckInfo.stuckType}`);
  // }
  
  const preservedGameState: GameState = {
    ...result.gameState,
    currentArea: newArea,
    progressMetrics: newMetrics,
  };

  // Build updated agent state
  const updatedAgentState: Partial<AgentState> = {
    status: 'acting',
    gameState: preservedGameState,
    lastDecision: result.decision,
    totalDecisions: (currentState?.totalDecisions ?? 0) + 1,
    totalCost: (currentState?.totalCost ?? 0) + cost,
    totalTokensIn: (currentState?.totalTokensIn ?? 0) + totalPromptTokens,
    totalTokensOut: (currentState?.totalTokensOut ?? 0) + totalCompletionTokens,
    lastUpdatedAt: new Date(),
    badges: newBadges,
  };

  // Track badge timestamps and costs
  if (badgeEarned && currentState) {
    updatedAgentState.badgeTimestamps = [
      ...(currentState.badgeTimestamps || []),
      new Date(),
    ];
    updatedAgentState.costPerBadge = [
      ...(currentState.costPerBadge || []),
      updatedAgentState.totalCost!,
    ];
  }

  // console.log(`[workflow:gameLoopIteration] Complete`, { agentId: input.agentId, decision: result.decision.button });

  return {
    decision: result.decision,
    gameState: preservedGameState,
    updatedAgentState,
    cost,
  };
}

// Initialize a new agent state
export async function initializeAgentState(
  agentId: string,
  modelId: ModelId
): Promise<AgentState> {
  const personality = AGENT_PERSONALITIES[agentId] || AGENT_PERSONALITIES['agent-1'];
  
  return {
    id: agentId,
    modelId,
    personality,
    status: 'idle',
    gameState: createInitialGameState(),
    decisions: [],
    lastDecision: null,
    totalDecisions: 0,
    totalCost: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    fallbackCount: 0,
    startedAt: null,
    lastUpdatedAt: null,
    badges: 0,
    badgeTimestamps: [],
    costPerBadge: [],
  };
}
