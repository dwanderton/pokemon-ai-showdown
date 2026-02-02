# Product Engineer Review: Infrastructure & RL Integration

## Summary
We're underutilizing Redis and Blob storage while our new RL-based progress tracking system adds significant capabilities. The codebase needs better integration between the RL reward functions and persistent state tracking.

## Critical Issues

### 1. Redis Usage is Minimal
**Current state:** Only using Redis for agent state, heartbeat, frames count, and decisions keys.
**Missing:** No leaderboard updates, no progress metrics persistence, no milestone tracking, no location history.

**Recommendation:** Expand Redis usage:
```typescript
export const keys = {
  // Existing
  agentState: (agentId: string) => `agent:${agentId}:state`,
  agentHeartbeat: (agentId: string) => `agent:${agentId}:heartbeat`,
  agentFrames: (agentId: string) => `agent:${agentId}:frames`,
  agentDecisions: (agentId: string) => `agent:${agentId}:decisions`,
  leaderboard: () => 'leaderboard:badges',
  
  // NEW: RL-based tracking
  agentMilestones: (agentId: string) => `agent:${agentId}:milestones`,
  agentLocations: (agentId: string) => `agent:${agentId}:locations`,
  agentRewardHistory: (agentId: string) => `agent:${agentId}:rewards`,
  agentProgressMetrics: (agentId: string) => `agent:${agentId}:progress`,
  globalMilestoneLeaderboard: () => 'leaderboard:milestones',
  stuckDetection: (agentId: string) => `agent:${agentId}:stuck`,
} as const;
```

### 2. Blob Storage Not Used for Replays
**Current state:** Frames can be stored but not leveraged for replay generation.
**Paper insight:** Visual frame stacking was important for temporal awareness.

**Recommendation:** Store key decision frames for replay capability and debugging.

### 3. RL Types Not Persisted
**Issue:** `ProgressMetrics.locationsThisEpisode` uses JavaScript `Set` which won't serialize to Redis.
**Fix:** Use array and convert to Set when reading.

## Recommendations

### High Priority
1. **Persist progress metrics to Redis** after each decision loop
2. **Track milestone completions** in a sorted set for leaderboard
3. **Store stuck detection state** to carry across sessions
4. **Use Blob for milestone achievement screenshots** - auto-capture when badge obtained

### Medium Priority
1. **Add reward history tracking** - store last 100 reward values for debugging
2. **Implement location heatmap data** - which areas are visited most
3. **Add decision confidence trend** - track if model is getting more/less confident

### Code Quality
1. The `game-knowledge.ts` file is getting large (500+ lines) - consider splitting into modules
2. RL functions should be tested with unit tests
3. Progress metrics need serialization helpers

## Questions
1. Should we store ALL frames or just milestone frames to Blob?
2. What's the Redis memory budget? Location tracking could grow large.
3. Should we implement TTL on old session data?
