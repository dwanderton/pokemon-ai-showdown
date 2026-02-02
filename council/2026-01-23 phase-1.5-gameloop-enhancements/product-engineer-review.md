# Product Engineer Review: Phase 1.5 Game Loop Enhancements

**Date:** 2026-01-23
**Reviewer:** Product Engineer Perspective
**Focus:** Implementation Feasibility & Priority

---

## Executive Summary

Phase 1 is complete. Before scaling to multi-agent (Phase 2), we should improve single-agent decision quality. This review identifies high-impact, low-effort improvements for Phase 1.5.

---

## Implementation Priority Matrix

| Enhancement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Adaptive wait timing | LOW | HIGH | **P0** |
| Game state detection in prompt | LOW | MEDIUM | **P0** |
| OCR for dialogue text | MEDIUM | HIGH | **P1** |
| Structured notes schema | LOW | MEDIUM | **P1** |
| Button confidence visualization | LOW | MEDIUM | **P2** |
| Save state parsing | HIGH | HIGH | **P3** (Phase 2.5) |

---

## P0: Immediate Wins

### 1. Adaptive Wait Timing
**Current:** Fixed 6000ms wait after button sequence
**Proposed:** Detect state and adjust:

```typescript
// In agent-card.tsx after button sequence execution
const detectGameState = (frame: string): 'dialogue' | 'battle' | 'overworld' | 'menu' | 'unknown' => {
  // Simple heuristics based on frame regions or AI response
  // Can start with AI-returned state, then add vision heuristics
  return lastDecision?.gameState?.currentContext || 'unknown';
};

const waitTimes = {
  dialogue: 1500,
  battle: 2500,
  overworld: 3000,
  menu: 2000,
  unknown: 6000,
};
```

**Effort:** 2 hours
**Impact:** 2-3x faster in dialogue sections

### 2. Include Detected State in Response
**Current:** AI returns `currentContext` but we don't use it
**Proposed:** Use `currentContext` to:
- Adjust wait time (above)
- Show state badge in UI
- Improve stuck detection logic

**Effort:** 1 hour
**Impact:** Better state awareness

---

## P1: Next Sprint

### 3. OCR Preprocessing with Tesseract.js
**Problem:** Model re-interprets text every frame, wastes tokens
**Solution:**
```typescript
import Tesseract from 'tesseract.js';

async function extractDialogueText(frame: string): Promise<string | null> {
  // Crop to dialogue box region (bottom 1/3 of screen typically)
  const dialogueRegion = cropToDialogueBox(frame);
  const result = await Tesseract.recognize(dialogueRegion, 'eng');
  return result.data.text.trim() || null;
}
```
**Add to prompt:**
```
## Detected Text on Screen
"${extractedText}"
```

**Effort:** 4-6 hours (cropping, testing accuracy)
**Impact:** Much better dialogue comprehension

### 4. Structured Notes Schema
**Problem:** Free-form notes are inconsistent
**Solution:** Add schema validation:

```typescript
const notesSchema = z.object({
  objective: z.string().optional(),
  strategy: z.enum(['wall-hug', 'perimeter-scan', 'direct', 'explore']).optional(),
  failedDirections: z.array(z.object({
    direction: z.string(),
    count: z.number()
  })).optional(),
  discoveries: z.array(z.string()).optional(),
});
```

**Effort:** 3 hours
**Impact:** More reliable navigation recovery

---

## P2: Polish

### 5. Button Confidence Visualization
**Current:** Scores calculated but only shown in debug
**Proposed:** Small horizontal bar chart below controller

**Effort:** 2 hours
**Impact:** User understanding of AI reasoning

---

## P3: Defer to Phase 2.5

### Save State Parsing
- High effort (8-16 hours)
- Needs EmulatorJS API research
- Better suited for infrastructure sprint
- Combine with Redis expansion work

---

## Recommended Phase 1.5 Scope

**Sprint Goal:** Improve decision quality and speed for single agent

**Tasks:**
1. [ ] Implement adaptive wait timing based on `currentContext`
2. [ ] Add game state badge to UI (from AI response)
3. [ ] Add OCR preprocessing for dialogue text
4. [ ] Implement structured notes schema
5. [ ] Add button confidence bar visualization

**Estimated Effort:** 2-3 days
**Success Metric:** Agent progresses past Pallet Town more consistently

---

## Dependencies

- Tesseract.js for OCR (npm package)
- No infrastructure changes needed
- No new integrations required

---

## Risks

1. **OCR accuracy** - GBA fonts may need training data
2. **State detection** - May need fallback to vision analysis
3. **Notes migration** - Existing notes in Redis are unstructured

---

## Verdict

**Proceed with Phase 1.5** implementing P0 and P1 items. This will significantly improve decision quality before scaling to multi-agent competition.
