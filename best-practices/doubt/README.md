# Best Practice: Doubt

## The Anti-Pattern

When facing technical uncertainty, the instinct is to immediately propose alternatives:

> "If X doesn't work, we can always use Y..."
> "This might be hard, so let's have Z as a backup..."
> "I'm not sure about A, maybe we should consider B instead..."

This hedging behavior:
- Dilutes commitment to the chosen solution
- Creates unnecessary decision fatigue
- Signals lack of confidence in the team's ability to solve hard problems
- Often leads to premature pivots before truly understanding the original challenge

## The Practice

**Sit in the difficulty.**

When you encounter uncertainty or potential obstacles:

1. **Acknowledge the challenge** - Name what's hard without catastrophizing
2. **Commit to the path** - The architecture was chosen for good reasons
3. **Work the problem** - Exhaust the current approach before considering alternatives
4. **Consult, don't pivot** - If truly stuck, bring the specific blocker to the team for discussion
5. **Document learnings** - Whether successful or not, capture what was learned

## Example

### Bad (Hedging)
> "EmulatorJS might not support frame capture. If it doesn't work, we could try gbajs, or maybe run the emulator server-side with Puppeteer, or we could look at that other library..."

### Good (Committed)
> "I need to verify EmulatorJS supports frame capture. Let me read the docs thoroughly and build a proof-of-concept. If I hit a specific blocker, I'll document exactly what's failing and we can discuss."

## When to Actually Pivot

A pivot is warranted when:
- A **fundamental technical limitation** is discovered (not just "this is hard")
- The **cost/benefit ratio** has materially changed based on new information
- The team has **explicitly discussed** and agreed on the change

A pivot is NOT warranted when:
- Something is harder than expected
- Documentation is sparse
- The first attempt didn't work
- You feel uncertain

## Mantra

> "The spec was written with intention. Trust the architecture. Work the problem."

---

*Added: January 22, 2026*
*Context: Phase 1 kickoff - reminder to commit fully before suggesting alternatives*
