# CTO Review: Phase 1.5 Game Loop Enhancements

**Date:** 2026-01-23
**Reviewer:** CTO Perspective
**Focus:** Technical Architecture & Decision Making Quality

---

## Current State Assessment

The game loop is functional but decision quality could be improved. Key observations:

1. **6-second wait time** is long - could be adaptive based on game state
2. **No frame differencing** - we detect "visual change" but don't leverage it deeply
3. **Notes (memStash)** is text-based - could benefit from structured format
4. **No game state extraction** - purely vision-based, missing structured data

---

## Recommended Enhancements (Priority Order)

### 1. Adaptive Wait Timing (HIGH)
**Problem:** Fixed 6s wait regardless of context
**Solution:**
```typescript
const waitTime = {
  'dialogue': 1500,    // Text advances fast
  'battle-menu': 2000, // Need to see options
  'overworld': 3000,   // Movement animation
  'transition': 4000,  // Screen transitions
  'unknown': 6000      // Fallback
}
```
**Impact:** 2-3x faster iteration in dialogue-heavy sections

### 2. Screenshot + OCR Preprocessing (HIGH)
**Problem:** Vision models waste tokens re-reading text each frame
**Solution:**
- Run Tesseract.js OCR on dialogue boxes
- Extract text, send as structured data alongside image
- Reduce model interpretation burden
**Impact:** Better text comprehension, lower token usage

### 3. Structured Notes Format (MEDIUM)
**Problem:** Free-form notes hard to parse and reason about
**Solution:**
```typescript
interface StructuredNotes {
  currentObjective: string;
  failedAttempts: { direction: string; count: number }[];
  discoveries: string[];
  currentStrategy: 'wall-hug' | 'perimeter-scan' | 'direct';
}
```
**Impact:** More reliable stuck recovery

### 4. Save State Game Data Extraction (MEDIUM)
**Problem:** Vision-only limits tactical awareness
**Solution:** 
- Every 10 decisions, extract save state
- Parse WRAM for: party HP, badges, position, map ID
- Include structured data in prompt
**Impact:** Better battle decisions, health-aware healing

### 5. Frame Differencing for Change Detection (LOW)
**Problem:** Binary "changed/not changed" misses nuance
**Solution:**
- Calculate pixel difference percentage
- Identify changed regions (dialogue box, map area, menu)
- Weight confidence based on change type
**Impact:** Smarter button effectiveness tracking

---

## Architecture Recommendations

1. **Add a `GameStateAnalyzer` service** that combines vision + OCR + memory
2. **Create a `DecisionContext` builder** that assembles all signals
3. **Implement `AdaptiveLoopTimer`** that adjusts based on detected state

---

## Technical Debt to Address

- [ ] Remove commented-out console.log statements (cleanup)
- [ ] Add TypeScript strict mode for schema validation
- [ ] Implement proper error boundaries for AI failures

---

## Verdict

**Proceed with Phase 1.5** focusing on:
1. Adaptive wait timing (quick win)
2. OCR preprocessing (high value)
3. Structured notes (stability improvement)

Save state parsing can wait until Phase 2.5 infrastructure work.
