# Council Summary: Phase 1.5 Game Loop Enhancements

**Date:** 2026-01-23
**Participants:** CTO, Designer, Product Engineer
**Decision:** APPROVED - Proceed with Phase 1.5

---

## Consensus Recommendations

### Unanimous P0 (Do Immediately)
1. **Adaptive Wait Timing** - Use AI-detected `currentContext` to adjust wait:
   - Dialogue: 1.5s
   - Battle: 2.5s
   - Overworld: 3s
   - Menu: 2s
   - Unknown: 6s (current)

2. **Game State Badge** - Show detected state in UI next to status

### Strong Agreement P1 (Next Sprint)
3. **OCR Preprocessing** - Extract dialogue text with Tesseract.js
4. **Structured Notes Schema** - Enforce consistent format for AI memory

### Nice-to-Have P2
5. **Button Confidence Visualization** - Bar chart of confidence scores
6. **Decision Timeline** - Visual history of last N decisions

### Deferred to Phase 2.5
- Save state parsing (high effort, combine with infrastructure work)
- Frame differencing for change detection
- Memory address reading

---

## Action Items

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Adaptive wait timing | Dev | 2h | TODO |
| Game state badge UI | Dev | 1h | TODO |
| OCR integration | Dev | 4-6h | TODO |
| Structured notes | Dev | 3h | TODO |
| Button confidence bar | Dev | 2h | TODO |

**Total Estimated Effort:** 12-14 hours (2-3 days)

---

## Success Criteria

- Agent should progress past Pallet Town within 50 decisions
- Dialogue sections should process 2-3x faster
- Stuck recovery should trigger after 3 consecutive same-direction failures

---

## Next Review

Schedule Phase 1.5 completion review after implementation.
Then proceed to Phase 2 (Multi-Agent Competition).
