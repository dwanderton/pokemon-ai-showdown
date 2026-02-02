# Designer Review: Phase 1.5 Game Loop Enhancements

**Date:** 2026-01-23
**Reviewer:** Designer Perspective
**Focus:** User Experience & Visual Feedback

---

## Current UX Issues

1. **No visual indicator of game state detection** - User can't see if AI recognizes dialogue vs overworld
2. **Wait time feels arbitrary** - No progress indicator during 6s wait
3. **Notes panel is plain text** - Hard to scan for important info
4. **No confidence visualization** - Button scores exist but aren't shown

---

## Recommended UX Enhancements

### 1. Game State Indicator Badge
Show detected state next to status:
- `[running] dialogue` - Orange badge
- `[running] overworld` - Green badge  
- `[running] battle` - Red badge
- `[running] menu` - Blue badge

### 2. Wait Progress Ring
During the post-input wait:
- Circular progress indicator around the status badge
- Shows time remaining before next capture
- Subtle animation keeps UI feeling alive

### 3. Structured Notes Display
Instead of raw text, show:
```
Current Goal: Find exit from room
Strategy: Wall-hug (anti-clockwise)
Failed: UP (3x), RIGHT (2x)
Discoveries: "Exit not on bottom wall"
```

### 4. Button Confidence Bar
Below the GBA controller, show a mini bar chart:
- Horizontal bars for each button
- Length = confidence score
- Highlight the selected button(s)
- Updates after each decision

### 5. Decision Timeline
Small timeline showing last 5 decisions:
```
A → A → DOWN → LEFT → A
     ^stuck    ^worked
```
Color-coded by visual change detection.

---

## Visual Polish Suggestions

1. **Subtle pulse animation** on emulator border when thinking
2. **Flash effect** on button press in controller
3. **Fade transition** between "thinking" and "running" states
4. **Toast notification** for milestone events (badge, new area)

---

## Verdict

These UX improvements would make the AI's decision-making process more transparent and engaging to watch. Prioritize:
1. Game state indicator (low effort, high clarity)
2. Button confidence bar (helps understand AI reasoning)
3. Structured notes display (improves readability)
