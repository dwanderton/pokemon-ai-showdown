import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Key patterns for agent state and RL-based tracking
export const keys = {
  // Core agent state
  agentState: (agentId: string) => `agent:${agentId}:state`,
  agentHeartbeat: (agentId: string) => `agent:${agentId}:heartbeat`,
  agentFrames: (agentId: string) => `agent:${agentId}:frames`,
  agentDecisions: (agentId: string) => `agent:${agentId}:decisions`,
  
  // RL-based progress tracking (from arxiv:2502.19920)
  agentMilestones: (agentId: string) => `agent:${agentId}:milestones`,
  agentLocations: (agentId: string) => `agent:${agentId}:locations`,
  agentProgressMetrics: (agentId: string) => `agent:${agentId}:progress`,
  agentRewardHistory: (agentId: string) => `agent:${agentId}:rewards`,
  agentStuckState: (agentId: string) => `agent:${agentId}:stuck`,
  
  // MemStash - persistent memory for AI agents
  agentMemStash: (agentId: string) => `agent:${agentId}:memstash`,
  agentDecisionLog: (agentId: string) => `agent:${agentId}:decisionlog`,
  
  // Leaderboards
  leaderboard: () => 'leaderboard:badges',
  milestoneLeaderboard: () => 'leaderboard:milestones',
  costLeaderboard: () => 'leaderboard:cost',
} as const;

// Heartbeat timeout in seconds
export const HEARTBEAT_TIMEOUT = 30;

// TTL for various data types (in seconds)
export const TTL = {
  heartbeat: 60,
  rewardHistory: 3600, // 1 hour
  stuckState: 300, // 5 minutes
} as const;
