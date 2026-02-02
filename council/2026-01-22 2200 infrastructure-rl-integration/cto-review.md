# CTO Review: Infrastructure & RL Integration

## Summary
The RL paper provides critical insights for reward shaping that could dramatically improve agent performance. Our current infrastructure is underutilized but well-positioned. Key focus should be on implementing the paper's proven reward functions while leveraging Redis for state persistence and Blob for replay capability.

## Critical Issues

### 1. Missing Game State Vector (from Paper)
**Paper approach:** "The game state vector includes the current HP and level of each Pokemon in the party, as well as flags indicating the completion status of various in-game events."

**Current state:** We rely purely on vision. We should add a game state summary to the prompt.

**Cost implication:** Adding structured state data reduces tokens needed for the model to "figure out" what's happening.

### 2. Reward Function Implementation Gap
**Paper rewards implemented:** Event (+2), Navigation (+0.005/coord), Healing (2.5 * HP fraction), Level (0.5 * min formula)

**Missing in our workflow:** These rewards are calculated in `game-knowledge.ts` but NOT used for:
- Decision confidence weighting
- Model prompt context
- Progress tracking display

### 3. Infrastructure Utilization

| Resource | Current Usage | Optimal Usage |
|----------|--------------|---------------|
| Redis | Agent state only | + Milestones, locations, rewards, leaderboards |
| Blob | Frame storage available | + Milestone screenshots, replay sequences |
| AI Gateway | Single model calls | Consider batch/parallel for efficiency |

## Recommendations

### Immediate (This Sprint)
1. **Persist ProgressMetrics to Redis** - Enable session resumption with full context
2. **Add milestone detection to workflow** - Compare state changes against milestone definitions
3. **Store milestone screenshots to Blob** - Auto-capture achievement moments

### Short-term
1. **Implement dynamic step budget** - Paper finding: "10,240 steps + 2,048 per event" improved training
2. **Add stuck detection response** - When stuck detected, inject recovery prompt
3. **Track cost-per-milestone** - Key metric for model comparison

### Long-term (Stretch)
1. **Memory reading integration** - Paper used HP/level from memory, not just vision
2. **Visited coordinate tracking** - Paper: "48x48 binary crop showing visited coordinates"
3. **Hierarchical actions** - Paper suggests combining primitives for efficiency

## Cost Analysis

**Current observation:** ~$0.01-0.02 per decision with GPT-4o vision
**Paper comparison:** RL training used 400M steps - we're using direct inference

**Optimization opportunities:**
1. Skip frames when screen unchanged (already doing via hash)
2. Use cheaper model for "obvious" decisions (NOT recommended per spec - showcase mode)
3. Reduce prompt token count by caching game knowledge

## Technology Showcase Opportunities

| Feature | Vercel Tech | Status |
|---------|-------------|--------|
| Durable state | Redis + Workflow | Partial |
| Frame replay | Blob storage | Available |
| Real-time updates | SWR + updateTag | Not used |
| Edge caching | use cache | Implemented |
| View transitions | React 19.2 | Not used |

## Questions
1. Should we implement the paper's GRU memory approach? (4M params vs our stateless)
2. Priority: Memory reading vs better reward tracking?
3. Target: How many milestones should agent complete for ShipAI demo?
