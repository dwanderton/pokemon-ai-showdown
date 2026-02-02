# Pending Todos

Last Updated: 2026-01-22 22:00 UTC

## In Progress

- [ ] Debug frame capture - frames still returning empty/invalid
  - EmulatorJS WebGL buffer clears before we can read it
  - gameManager.screenshot() awaited but still getting blank data
  - Need alternative approach - possibly requestAnimationFrame timing

## Queued (Council Review 2026-01-22 2200)

### High Priority - Infrastructure (Phase 2.5)
- [ ] Persist progress metrics to Redis after each decision
- [ ] Track milestone completions in Redis sorted set
- [ ] Store visited locations for navigation reward tracking
- [ ] Implement stuck detection persistence
- [ ] Auto-capture milestone screenshots to Vercel Blob
- [ ] Fix ProgressMetrics.locationsThisEpisode serialization (Set -> Array)

### Medium Priority - RL UI
- [ ] Progress confidence meter visualization
- [ ] Milestone timeline component  
- [ ] Stuck state indicator on agent card
- [ ] Reward event feed (floating notifications)

### Lower Priority - Polish
- [ ] Split game-knowledge.ts into modules (500+ lines)
- [ ] Add unit tests for RL reward functions
- [ ] Memory reading integration for enhanced state awareness

## Completed (This Session)

- [x] Cost tracking confirmed working
- [x] Fixed [v0] log prefix in page.tsx -> [page:Home]
- [x] Fixed empty src warning in ThoughtsPanel - validates frame length > 100
- [x] Added frame validation before AI call - must be valid data URL > 1KB
- [x] Added Sonner toast notification when frame capture fails
- [x] Added 2 second delay when frame is invalid before retry
- [x] Confirmed mutex pattern via processingLockRef is working
- [x] Create todo-management skill
- [x] Create emulator-js skill
- [x] Button inputs now working
- [x] Fixed button mapping for GBA (A=8, B=0, START=3, etc.)
- [x] Decision history now shows ALL prior decisions (full stack)
- [x] Added "guesses" stat for fallback decisions
- [x] Thoughts panel: added timestamps, ordered by most recent at top
- [x] Thoughts panel: fixed height (h-64) and scrollable
- [x] Fixed unmute setting volume to 60% instead of 20%
- [x] Removed emulator hover options overlay (hidden all EJS_Buttons)
- [x] Disabled keyboard input (AI controls only) - keydown/keyup blocked
- [x] Disabled context menu - right-click blocked
- [x] Added CSS to hide EmulatorJS overlays (bar, controls, menu, volume)
- [x] Fixed cost calculation - fallback now estimates ~1600 tokens per call
