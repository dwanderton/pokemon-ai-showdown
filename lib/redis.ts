import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    
    if (!url || !token) {
      throw new Error('Missing Upstash Redis configuration. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.');
    }
    
    redisInstance = new Redis({ url, token });
  }
  return redisInstance;
}

// Legacy export for backwards compatibility - use getRedis() instead
export const redis = {
  get get() { return getRedis().get.bind(getRedis()); },
  get set() { return getRedis().set.bind(getRedis()); },
  get del() { return getRedis().del.bind(getRedis()); },
  get hget() { return getRedis().hget.bind(getRedis()); },
  get hset() { return getRedis().hset.bind(getRedis()); },
  get hgetall() { return getRedis().hgetall.bind(getRedis()); },
  get lpush() { return getRedis().lpush.bind(getRedis()); },
  get lrange() { return getRedis().lrange.bind(getRedis()); },
  get ltrim() { return getRedis().ltrim.bind(getRedis()); },
  get zadd() { return getRedis().zadd.bind(getRedis()); },
  get zrange() { return getRedis().zrange.bind(getRedis()); },
  get zrevrange() { return getRedis().zrevrange.bind(getRedis()); },
  get expire() { return getRedis().expire.bind(getRedis()); },
  get sadd() { return getRedis().sadd.bind(getRedis()); },
  get smembers() { return getRedis().smembers.bind(getRedis()); },
  get sismember() { return getRedis().sismember.bind(getRedis()); },
  get incr() { return getRedis().incr.bind(getRedis()); },
  get incrby() { return getRedis().incrby.bind(getRedis()); },
  get incrbyfloat() { return getRedis().incrbyfloat.bind(getRedis()); },
};

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
