// Redis instance is lazily loaded only when configured
let redisInstance: unknown = null;
let redisLoaded = false;

// Check if Redis is configured
export function isRedisConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Lazily load Redis only when actually needed and configured
async function loadRedis() {
  if (!isRedisConfigured()) {
    return null;
  }
  
  if (!redisLoaded) {
    const { Redis } = await import('@upstash/redis');
    redisInstance = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
    redisLoaded = true;
  }
  return redisInstance;
}

// In-memory fallback store for when Redis is not configured
const memoryStore = new Map<string, { value: unknown; expires?: number }>();

// Clean expired entries periodically
function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expires && entry.expires < now) {
      memoryStore.delete(key);
    }
  }
}

// Memory-based fallback implementations
const memoryFallback = {
  async get<T>(key: string): Promise<T | null> {
    cleanExpired();
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value as T;
  },
  async set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'> {
    const expires = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    memoryStore.set(key, { value, expires });
    return 'OK';
  },
  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (memoryStore.delete(key)) count++;
    }
    return count;
  },
  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const next = current + 1;
    await this.set(key, next);
    return next;
  },
  async incrby(key: string, amount: number): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const next = current + amount;
    await this.set(key, next);
    return next;
  },
  async incrbyfloat(key: string, amount: number): Promise<number> {
    return this.incrby(key, amount);
  },
  async hget<T>(key: string, field: string): Promise<T | null> {
    const hash = await this.get<Record<string, unknown>>(key);
    return (hash?.[field] as T) || null;
  },
  async hset(key: string, field: string, value: unknown): Promise<number> {
    const hash = (await this.get<Record<string, unknown>>(key)) || {};
    hash[field] = value;
    await this.set(key, hash);
    return 1;
  },
  async hgetall<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  },
  async lpush(key: string, ...values: unknown[]): Promise<number> {
    const list = (await this.get<unknown[]>(key)) || [];
    list.unshift(...values);
    await this.set(key, list);
    return list.length;
  },
  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const list = (await this.get<T[]>(key)) || [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  },
  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const list = (await this.get<unknown[]>(key)) || [];
    const trimmed = list.slice(start, stop === -1 ? undefined : stop + 1);
    await this.set(key, trimmed);
    return 'OK';
  },
  async zadd(key: string, ...args: unknown[]): Promise<number> {
    return 1; // Simplified
  },
  async zrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    return [];
  },
  async zrevrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    return [];
  },
  async expire(key: string, seconds: number): Promise<number> {
    const entry = memoryStore.get(key);
    if (entry) {
      entry.expires = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  },
  async sadd(key: string, ...members: unknown[]): Promise<number> {
    const set = (await this.get<unknown[]>(key)) || [];
    let added = 0;
    for (const member of members) {
      if (!set.includes(member)) {
        set.push(member);
        added++;
      }
    }
    await this.set(key, set);
    return added;
  },
  async smembers<T>(key: string): Promise<T[]> {
    return (await this.get<T[]>(key)) || [];
  },
  async sismember(key: string, member: unknown): Promise<number> {
    const set = (await this.get<unknown[]>(key)) || [];
    return set.includes(member) ? 1 : 0;
  },
};

// Create a proxy that uses Redis when available, memory fallback otherwise
function createRedisProxy() {
  const methods = [
    'get', 'set', 'del', 'hget', 'hset', 'hgetall',
    'lpush', 'lrange', 'ltrim', 'zadd', 'zrange', 'zrevrange',
    'expire', 'sadd', 'smembers', 'sismember', 'incr', 'incrby', 'incrbyfloat'
  ] as const;
  
  const proxy: Record<string, unknown> = {};
  
  for (const method of methods) {
    proxy[method] = async (...args: unknown[]) => {
      // Only try to load Redis if configured
      if (isRedisConfigured()) {
        const redisClient = await loadRedis();
        if (redisClient) {
          return (redisClient as Record<string, Function>)[method](...args);
        }
      }
      // Fall back to memory implementation
      return (memoryFallback as Record<string, Function>)[method](...args);
    };
  }
  
  return proxy;
}

export const redis = createRedisProxy() as {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<'OK'>;
  del: (...keys: string[]) => Promise<number>;
  hget: <T>(key: string, field: string) => Promise<T | null>;
  hset: (key: string, field: string, value: unknown) => Promise<number>;
  hgetall: <T>(key: string) => Promise<T | null>;
  lpush: (key: string, ...values: unknown[]) => Promise<number>;
  lrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
  ltrim: (key: string, start: number, stop: number) => Promise<'OK'>;
  zadd: (key: string, ...args: unknown[]) => Promise<number>;
  zrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
  zrevrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
  expire: (key: string, seconds: number) => Promise<number>;
  sadd: (key: string, ...members: unknown[]) => Promise<number>;
  smembers: <T>(key: string) => Promise<T[]>;
  sismember: (key: string, member: unknown) => Promise<number>;
  incr: (key: string) => Promise<number>;
  incrby: (key: string, amount: number) => Promise<number>;
  incrbyfloat: (key: string, amount: number) => Promise<number>;
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
