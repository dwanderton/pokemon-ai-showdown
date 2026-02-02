# Designer Review: Infrastructure & RL Integration

## Summary
The RL integration provides rich data for visual storytelling - milestones, progress confidence, and stuck detection can all drive engaging UI moments. The infrastructure supports replay capability which opens up clip generation and highlight reels.

## Critical Issues

### 1. Progress Visualization Missing
**Data available:** progressConfidence (0-1), milestones, reward values
**UI status:** Not displayed anywhere

**Recommendation:** Add progress indicator showing:
- Current milestone target
- Confidence trend (is agent making progress or stuck?)
- Recent reward events (healing, level up, exploration)

### 2. Milestone Achievements Not Celebrated
**Paper milestones:** Brock, Mt Moon, Cerulean, Misty, Bill's Quest
**Current UI:** Only badge count displayed

**Recommendation:** Milestone celebration system:
- Toast notification with screenshot
- Leaderboard update animation
- Sound cue (optional)
- Shareable moment generation

### 3. Stuck State Not Communicated
**Data available:** `detectStuckState()` returns type: wall_collision, dialogue_loop, unknown
**UI status:** No indication when agent is stuck

**Recommendation:** Visual stuck indicator:
- Pulsing border color change
- "Stuck" badge on agent card
- Recovery attempt counter
- AI commentary about being stuck (personality-driven)

## Recommendations

### Visual Storytelling Enhancements

1. **Progress Confidence Meter**
   - Circular gauge showing 0-100% confidence
   - Color gradient: red (0%) -> yellow (50%) -> green (100%)
   - Smooth animation on updates
   - Tooltip showing trend

2. **Milestone Timeline**
   - Horizontal track showing all milestones
   - Completed = filled, Current = pulsing, Future = dimmed
   - Click to see screenshot from that moment
   - Compare agents' timelines side-by-side

3. **Reward Event Feed**
   - Small floating notifications: "+Navigation", "+Healing", "+Level Up"
   - Stack and fade out after 2 seconds
   - Color-coded by reward type

4. **Stuck Recovery Animation**
   - When stuck detected: agent card shakes slightly
   - AI thought bubble: "Hmm, I seem to be stuck..."
   - Recovery attempt: "Let me try something different..."
   - Success: celebration micro-animation

### Replay & Highlights

**Blob storage enables:**
1. **Milestone replay** - Watch the moment an agent beat a gym
2. **Stuck recovery replay** - See how agent escaped
3. **Decision highlight reel** - Best/worst decisions compilation
4. **Side-by-side comparison** - Same milestone, different agents

### Agent Personality Integration

Use stuck detection and progress for personality reactions:

| State | Emiru-style | Asmongold-style | Jerma-style |
|-------|-------------|-----------------|-------------|
| Stuck (wall) | "Oops! Wrong way hehe" | "This wall is broken" | "I'm going to phase through this wall with my mind" |
| Stuck (dialogue) | "So much reading!" | "Skip skip skip" | "I've read this 47 times now" |
| Low confidence | "I'm a bit confused..." | "Whatever, I'll figure it out" | "Trust the process" |
| High confidence | "I know exactly what to do!" | "Easy game" | "This is my moment" |

## Questions
1. Should milestone screenshots auto-upload to Blob or only on user request?
2. How prominent should the stuck indicator be? Subtle or obvious?
3. Should we show reward values numerically or just as visual feedback?
