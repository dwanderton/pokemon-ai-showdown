# Task: Structured Notes Schema

## Objective
Replace free-form text notes with a structured schema that the AI can populate, enabling better tracking and decision-making.

## Current State
- Notes are free-form text appended to Redis
- AI writes arbitrary strings which can be inconsistent
- Hard to extract specific information programmatically

## Target Schema

```typescript
interface StructuredNotes {
  // Current objective tracking
  currentObjective: string;
  objectiveProgress: string;
  
  // Navigation state
  lastKnownLocation: string;
  exitDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
  exploredDirections: string[]; // e.g., ["UP - blocked", "LEFT - door found"]
  
  // Stuck recovery
  stuckRecoveryMode: 'none' | 'perimeter_scan' | 'wall_hug' | 'backtrack';
  wallHugDirection: 'clockwise' | 'anticlockwise' | null;
  failedAttempts: string[]; // Last 5 failed actions with context
  
  // Game progress
  lastMilestone: string;
  knownNPCs: string[]; // NPCs encountered with notes
  knownItems: string[]; // Items found/used
  
  // Battle state (when relevant)
  lastBattleResult: 'won' | 'lost' | 'fled' | null;
  lowHPWarning: boolean;
}
```

## Implementation Steps

1. **Update decision schema in steps.ts**
   - Change `notes` field from `z.string()` to `z.object()` with structured fields
   - Make all fields optional/nullable for flexibility

2. **Update system prompt**
   - Document the structured notes format
   - Provide examples of how to populate each field

3. **Update Redis storage (memstash.ts)**
   - Store as JSON instead of plain text
   - Merge new notes with existing (don't overwrite)
   - Keep history of last N updates

4. **Update UI display**
   - Show structured notes in a formatted view
   - Highlight important fields (stuck mode, low HP warning)

## Acceptance Criteria
- [ ] AI returns structured notes object
- [ ] Notes merge correctly (array fields append, strings update)
- [ ] UI displays formatted notes
- [ ] Stuck recovery mode persists across decisions
- [ ] Failed attempts track last 5 entries

## Estimated Effort
4-6 hours
