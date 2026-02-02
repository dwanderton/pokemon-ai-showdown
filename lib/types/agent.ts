import type { GBAButton } from './emulator';

export type ModelId = 
  | 'openai/gpt-4o'
  | 'openai/gpt-4.1'
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-opus-4'
  | 'google/gemini-2.0-flash'
  | 'google/gemini-2.5-pro'
  | 'xai/grok-3'
  | 'xai/grok-3-mini';

export interface AgentPersonality {
  name: string;
  style: 'emiru' | 'asmongold' | 'jerma' | 'ludwig' | 'pokimane' | 'xqc';
  color: string;
  traits: string[];
}

export const AGENT_PERSONALITIES: Record<string, AgentPersonality> = {
  'agent-1': {
    name: 'Pokemon AI Showdown',
    style: 'emiru',
    color: 'bg-pink-500',
    traits: ['wholesome', 'cute reactions', 'loves Pokemon'],
  },
  'agent-2': {
    name: 'Asmon',
    style: 'asmongold',
    color: 'bg-amber-500',
    traits: ['blunt', 'strategic', 'complains about RNG'],
  },
  'agent-3': {
    name: 'Jerms',
    style: 'jerma',
    color: 'bg-red-500',
    traits: ['chaotic', 'unpredictable', 'weird observations'],
  },
  'agent-4': {
    name: 'Lud',
    style: 'ludwig',
    color: 'bg-blue-500',
    traits: ['competitive', 'stats-focused', 'trash talks'],
  },
  'agent-5': {
    name: 'Poki',
    style: 'pokimane',
    color: 'bg-purple-500',
    traits: ['encouraging', 'methodical', 'celebrates small wins'],
  },
  'agent-6': {
    name: 'X',
    style: 'xqc',
    color: 'bg-cyan-500',
    traits: ['fast-talking', 'impatient', 'speedrun-focused'],
  },
};

// Pokemon party member state (from RL paper insights)
export interface PartyPokemon {
  level: number;
  currentHP: number;
  maxHP: number;
  hpPercent: number; // 0-100
}

// Milestone events for reward tracking (based on RL paper)
export type GameMilestone = 
  | 'starter_chosen'
  | 'rival_1_defeated'
  | 'viridian_forest_entered'
  | 'viridian_forest_exited'
  | 'brock_defeated'
  | 'mt_moon_entered'
  | 'mt_moon_exited'
  | 'cerulean_reached'
  | 'misty_defeated'
  | 'bill_quest_complete'
  | 'vermilion_reached'
  | 'lt_surge_defeated'
  | 'rock_tunnel_exited'
  | 'celadon_reached'
  | 'erika_defeated'
  | 'koga_defeated'
  | 'sabrina_defeated'
  | 'blaine_defeated'
  | 'giovanni_defeated'
  | 'elite_four_entered'
  | 'champion_defeated';

// Progress tracking based on RL paper reward shaping
export interface ProgressMetrics {
  // Event reward: +2 for each milestone (from paper)
  completedMilestones: GameMilestone[];
  
  // Navigation reward: tracks unique coordinates visited
  uniqueLocationsVisited: number;
  locationsThisEpisode: Set<string>; // "area:x:y" format
  
  // Healing reward: tracks HP restoration events
  totalHealingEvents: number;
  
  // Level reward: sum of party levels with diminishing returns above threshold
  totalPartyLevels: number;
  levelThreshold: number; // Default 22 (reasonable for Misty)
  
  // Exploration tracking
  areasDiscovered: string[];
  
  // Stuck detection (from gamer intelligence rules)
  consecutiveNoChangeCount: number;
  lastEffectiveAction: string | null;
}

export interface GameState {
  // Location
  currentArea: string;
  inBattle: boolean;
  inMenu: boolean;
  inDialogue: boolean;
  inTextEntry: boolean; // Name entry screens

  // Team (enhanced from RL paper)
  pokemonCount: number;
  partyHealth: number[]; // HP percentages
  party: PartyPokemon[]; // Detailed party info
  totalPartyHP: number; // Sum of current HP / sum of max HP
  
  // Progress (enhanced with milestones)
  badges: number;
  playtime: string;
  currentMilestone: GameMilestone | null;
  progressMetrics: ProgressMetrics;

  // Recent context
  lastAction: GBAButton | null;
  lastActionResult: string;
  
  // Screen state detection
  screenType: 'overworld' | 'battle' | 'menu' | 'dialogue' | 'textEntry' | 'transition' | 'unknown';
}

// Confidence scores for each button option
export type ButtonConfidenceScores = Record<GBAButton, number>;

// Default confidence scores (all equal at start)
export const DEFAULT_CONFIDENCE_SCORES: ButtonConfidenceScores = {
  A: 0.5, B: 0.5, START: 0.5, SELECT: 0.5,
  UP: 0.5, DOWN: 0.5, LEFT: 0.5, RIGHT: 0.5,
  L: 0.5, R: 0.5, WAIT: 0.5,
};

// Default progress metrics
export const DEFAULT_PROGRESS_METRICS: ProgressMetrics = {
  completedMilestones: [],
  uniqueLocationsVisited: 0,
  locationsThisEpisode: new Set(),
  totalHealingEvents: 0,
  totalPartyLevels: 5, // Starter level
  levelThreshold: 22, // Good level for Misty (from paper)
  areasDiscovered: [],
  consecutiveNoChangeCount: 0,
  lastEffectiveAction: null,
};

// Create initial game state
export function createInitialGameState(): GameState {
  return {
    currentArea: 'Unknown',
    inBattle: false,
    inMenu: false,
    inDialogue: false,
    inTextEntry: false,
    pokemonCount: 0,
    partyHealth: [],
    party: [],
    totalPartyHP: 100,
    badges: 0,
    playtime: '0:00',
    currentMilestone: null,
    progressMetrics: { ...DEFAULT_PROGRESS_METRICS, locationsThisEpisode: new Set() },
    lastAction: null,
    lastActionResult: '',
    screenType: 'unknown',
  };
}

// A single step in a button sequence
export interface ButtonSequenceStep {
  button: string;
  confidence: number;
}

export interface AIDecision {
  // Derived from confidenceScores - the button with highest confidence (first in sequence)
  button: GBAButton;
  // Derived from confidenceScores - the highest confidence value
  confidence: number;
  // Model outputs
  screenAnalysis: string; // Description of visible items on screen and their locations
  reasoning: string;
  personality_comment: string;
  confidenceScores: ButtonConfidenceScores; // First step's confidence scores
  progressConfidence: number; // 0-1: Does the AI feel its actions are getting closer to goals?
  // Button sequence - multiple buttons to execute if confidence >= 0.85
  buttonSequence?: ButtonSequenceStep[]; // Array of buttons to execute in order
  // Metadata
  timestamp?: number; // Unix timestamp of when decision was made
  isFallback?: boolean; // True if this was a fallback/guess decision
}

export interface AgentState {
  id: string;
  modelId: ModelId;
  personality: AgentPersonality;
  status: 'idle' | 'thinking' | 'acting' | 'paused' | 'error';
  
  // Game progress
  gameState: GameState;
  
  // Decision history
  decisions: AIDecision[];
  lastDecision: AIDecision | null;
  
  // Metrics
  totalDecisions: number;
  totalCost: number;
  totalTokensIn: number;
  totalTokensOut: number;
  fallbackCount: number; // Number of times AI fell back to guessing
  startedAt: Date | null;
  lastUpdatedAt: Date | null;
  
  // Speedrun tracking
  badges: number;
  badgeTimestamps: Date[];
  costPerBadge: number[];
}

// Frame with visual change detection
export interface FrameWithChange {
  frame: string; // base64 image
  timestamp: number;
  visualChange: 'no_change' | 'change_detected' | 'unknown';
  frameHash?: string; // Simple hash for comparison
}

export interface GameLoopInput {
  agentId: string;
  modelId: ModelId;
  frame: string; // base64 image (current frame)
  previousFrames?: string[]; // Last 2-3 frames for visual context
  commandHistoryWithChanges?: string; // Formatted history with change indicators
  previousConfidenceScores?: ButtonConfidenceScores; // Previous confidence scores (adjusted for no-change penalty)
  previousDialogHistory?: string[]; // Last 10 personality comments to avoid repetition
  avoidStartSelect?: boolean; // True if START/SELECT pressed more than 2 times in a row
  avoidWait?: boolean; // True if WAIT pressed 3+ times in a row
  avoidB?: boolean; // True if B pressed 5+ times in a row
  buttonsToAvoid?: string[]; // Buttons that had no effect recently (1-4 consecutive no-changes)
  bannedButtons?: string[]; // Buttons pressed 10+ times, banned for next 2 prompts
  notes?: string; // Persistent notes from previous decisions (first 1000 chars)
  previousState?: GameState;
  previousDecisions?: AIDecision[];
  // Pre-analyzed screen type from first step
  screenTypeAnalysis?: {
    screenType: 'overworld' | 'battle' | 'menu' | 'dialogue' | 'textEntry' | 'transition' | 'unknown';
    briefDescription: string;
  };
}

export interface GameLoopOutput {
  decision: AIDecision;
  gameState: GameState;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
