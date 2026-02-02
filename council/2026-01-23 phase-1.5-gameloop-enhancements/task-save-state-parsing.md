# Task: Save State Parsing for Game State Extraction

## Objective
Parse GBA save states to extract structured game data (player position, Pokemon HP, badges, etc.) and feed to AI alongside visual frames.

## Current State
- Save states are created every 100 decisions and uploaded to Blob
- Save states are binary blobs, not parsed
- AI relies solely on visual frame analysis for game state

## Target Data Extraction

| Data | Memory Address | Priority |
|------|---------------|----------|
| Player X position | 0x02025A00 | P0 |
| Player Y position | 0x02025A02 | P0 |
| Current map ID | 0x02025A04 | P0 |
| Badge flags | 0x02025B08 | P0 |
| Party Pokemon count | 0x02024029 | P1 |
| Party Pokemon HP/Level | 0x02024284+ | P1 |
| Money | 0x02025AB4 | P2 |
| Event flags | Various | P2 |

## Implementation Steps

### Phase 1: Save State Structure Analysis
1. Create test route to download and inspect raw save state
2. Identify compression (likely zlib)
3. Map mGBA save state structure (header, WRAM offset)
4. Document findings in `/lib/save-state/README.md`

### Phase 2: Parser Implementation
1. Create `/lib/save-state/parser.ts`
   - `parseSaveState(buffer: ArrayBuffer): ParsedGameState`
   - Handle decompression
   - Extract WRAM section
   
2. Create `/lib/save-state/memory-map.ts`
   - Define memory address constants
   - Create extraction functions per data type
   
3. Create types `/lib/types/game-state-parsed.ts`
   ```typescript
   interface ParsedGameState {
     player: { x: number; y: number; mapId: number; };
     badges: number; // bitfield
     party: Array<{ species: number; hp: number; maxHp: number; level: number; }>;
     money: number;
   }
   ```

### Phase 3: Integration
1. Add `getParsedGameState()` to emulator hook
2. Pass parsed state to AI prompt (every N decisions, not every frame)
3. Update system prompt to explain structured game data format

### Phase 4: Optimization
1. Cache parsed state (only re-parse on save state update)
2. Add position change detection for stuck detection
3. Track coordinates visited for exploration metrics

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| mGBA format undocumented | Reference mGBA source code, test with known save states |
| Performance (100-200ms parse) | Parse async, every 10-20 decisions not every frame |
| Memory addresses vary by ROM | Detect ROM version, use address offsets |
| Save state size (1-2MB) | Only parse needed sections, don't store full state |

## Acceptance Criteria
- [ ] Can extract player X/Y position from save state
- [ ] Can extract badge count from save state
- [ ] Can extract party Pokemon HP from save state
- [ ] Parsed data included in AI prompt
- [ ] Parse time < 200ms
- [ ] Works with auto-saved states from Blob

## Estimated Effort
8-12 hours

## References
- mGBA source: https://github.com/mgba-emu/mgba
- Pokemon FireRed/LeafGreen memory map research
- specifications.md "Save State Parsing" section
