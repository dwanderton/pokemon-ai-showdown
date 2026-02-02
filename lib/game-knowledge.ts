/**
 * Game knowledge for Pokemon LeafGreen
 * Static data and utility functions for game state analysis
 * 
 * Includes RL-based reward functions from Pokemon Red RL paper (arxiv:2502.19920)
 */

// Local type definitions to avoid circular imports
type GameMilestone = string;
type PartyPokemon = {
  currentHP: number;
  maxHP: number;
  level: number;
};
type GameState = {
  totalPartyHP: number;
  inBattle: boolean;
  inDialogue: boolean;
  inMenu: boolean;
  currentArea: string;
  party: PartyPokemon[];
  progressMetrics: {
    completedMilestones: GameMilestone[];
    locationsThisEpisode: Set<string>;
  };
};

// js-set-map-lookups: O(1) type effectiveness lookup
export const TYPE_EFFECTIVENESS = new Map<string, Map<string, number>>([
  ['fire', new Map([['grass', 2], ['water', 0.5], ['fire', 0.5], ['rock', 0.5], ['bug', 2], ['steel', 2], ['ice', 2]])],
  ['water', new Map([['fire', 2], ['grass', 0.5], ['water', 0.5], ['rock', 2], ['ground', 2]])],
  ['grass', new Map([['water', 2], ['fire', 0.5], ['grass', 0.5], ['rock', 2], ['ground', 2], ['flying', 0.5], ['bug', 0.5]])],
  ['electric', new Map([['water', 2], ['flying', 2], ['ground', 0], ['electric', 0.5], ['grass', 0.5]])],
  ['normal', new Map([['rock', 0.5], ['ghost', 0], ['steel', 0.5]])],
  ['fighting', new Map([['normal', 2], ['rock', 2], ['steel', 2], ['ice', 2], ['dark', 2], ['flying', 0.5], ['poison', 0.5], ['bug', 0.5], ['psychic', 0.5], ['ghost', 0]])],
  ['flying', new Map([['grass', 2], ['fighting', 2], ['bug', 2], ['rock', 0.5], ['steel', 0.5], ['electric', 0.5]])],
  ['poison', new Map([['grass', 2], ['poison', 0.5], ['ground', 0.5], ['rock', 0.5], ['ghost', 0.5], ['steel', 0]])],
  ['ground', new Map([['fire', 2], ['electric', 2], ['poison', 2], ['rock', 2], ['steel', 2], ['grass', 0.5], ['bug', 0.5], ['flying', 0]])],
  ['rock', new Map([['fire', 2], ['ice', 2], ['flying', 2], ['bug', 2], ['fighting', 0.5], ['ground', 0.5], ['steel', 0.5]])],
  ['bug', new Map([['grass', 2], ['psychic', 2], ['dark', 2], ['fire', 0.5], ['fighting', 0.5], ['poison', 0.5], ['flying', 0.5], ['ghost', 0.5], ['steel', 0.5]])],
  ['ghost', new Map([['ghost', 2], ['psychic', 2], ['normal', 0], ['dark', 0.5]])],
  ['steel', new Map([['ice', 2], ['rock', 2], ['fire', 0.5], ['water', 0.5], ['electric', 0.5], ['steel', 0.5]])],
  ['psychic', new Map([['fighting', 2], ['poison', 2], ['psychic', 0.5], ['steel', 0.5], ['dark', 0]])],
  ['ice', new Map([['grass', 2], ['ground', 2], ['flying', 2], ['dragon', 2], ['fire', 0.5], ['water', 0.5], ['ice', 0.5], ['steel', 0.5]])],
  ['dragon', new Map([['dragon', 2], ['steel', 0.5]])],
  ['dark', new Map([['psychic', 2], ['ghost', 2], ['fighting', 0.5], ['dark', 0.5]])],
]);

export function getTypeEffectiveness(attackType: string, defenseType: string): number {
  const attackMap = TYPE_EFFECTIVENESS.get(attackType.toLowerCase());
  if (!attackMap) return 1;
  return attackMap.get(defenseType.toLowerCase()) ?? 1;
}

// Gym leaders and their levels for progress tracking
export const GYM_LEADERS = [
  { name: 'Brock', badge: 'Boulder', city: 'Pewter City', type: 'Rock', levels: [12, 14] },
  { name: 'Misty', badge: 'Cascade', city: 'Cerulean City', type: 'Water', levels: [18, 21] },
  { name: 'Lt. Surge', badge: 'Thunder', city: 'Vermilion City', type: 'Electric', levels: [21, 18, 24] },
  { name: 'Erika', badge: 'Rainbow', city: 'Celadon City', type: 'Grass', levels: [29, 24, 29] },
  { name: 'Koga', badge: 'Soul', city: 'Fuchsia City', type: 'Poison', levels: [37, 39, 37, 43] },
  { name: 'Sabrina', badge: 'Marsh', city: 'Saffron City', type: 'Psychic', levels: [38, 37, 38, 43] },
  { name: 'Blaine', badge: 'Volcano', city: 'Cinnabar Island', type: 'Fire', levels: [42, 40, 42, 47] },
  { name: 'Giovanni', badge: 'Earth', city: 'Viridian City', type: 'Ground', levels: [45, 42, 44, 45, 50] },
] as const;

// Milestone detection hints for AI (based on RL paper milestones)
export const MILESTONE_DETECTION_HINTS = {
  starter_chosen: 'You have a Pokemon in your party after leaving Oak\'s lab',
  rival_1_defeated: 'You won your first battle against your rival',
  viridian_forest_entered: 'You entered a forest area with Bug-type Pokemon',
  viridian_forest_exited: 'You exited Viridian Forest and can see Pewter City',
  brock_defeated: 'You received the Boulder Badge from Brock',
  mt_moon_entered: 'You entered Mt. Moon cave',
  mt_moon_exited: 'You exited Mt. Moon and can see Cerulean City area',
  cerulean_reached: 'You arrived in Cerulean City',
  misty_defeated: 'You received the Cascade Badge from Misty',
  bill_quest_complete: 'Bill transformed back to human and gave you the S.S. Ticket',
  vermilion_reached: 'You arrived in Vermilion City',
  lt_surge_defeated: 'You received the Thunder Badge from Lt. Surge',
} as const;

// Priority actions based on game state (from RL paper insights)
export const STATE_PRIORITY_ACTIONS = {
  lowHP: {
    priority: 'heal',
    actions: ['Find Pokemon Center (red roof building)', 'Use healing items from bag', 'Escape wild battles'],
  },
  inBattle: {
    priority: 'fight',
    actions: ['Use super effective moves', 'Switch if at disadvantage', 'Use items if needed', 'Run from weak wild Pokemon'],
  },
inDialogue: {
  priority: 'advance',
  actions: ['If text is still appearing/animating, use WAIT to let it finish', 'Press A to advance text if more text remains', 'When dialog ENDS, do NOT press A - MOVE AWAY immediately to avoid restarting the conversation', 'Press B to speed up or exit', 'Pay attention to hints'],
  },
  exploring: {
    priority: 'discover',
    actions: ['Find exits and new areas', 'Talk to NPCs for hints', 'Check signs for directions', 'Avoid unnecessary battles'],
  },
  stuck: {
    priority: 'escape',
    actions: ['If stuck in ANY menu, press B repeatedly (3-5 times) to escape back to gameplay', 'Try opposite direction', 'Walk away from current location', 'Use wall-hug navigation'],
  },
} as const;

// Speedrun splits based on speedrun.com/pkmnfrlg categories
export const SPEEDRUN_SPLITS = [
  { name: 'Get Starter', description: 'Choose starter Pokemon' },
  { name: 'Rival 1', description: 'First rival battle' },
  { name: 'Brock', description: 'Defeat Brock' },
  { name: 'Mt. Moon', description: 'Exit Mt. Moon' },
  { name: 'Misty', description: 'Defeat Misty' },
  { name: 'Rival 2', description: 'S.S. Anne rival battle' },
  { name: 'Lt. Surge', description: 'Defeat Lt. Surge' },
  { name: 'Rock Tunnel', description: 'Exit Rock Tunnel' },
  { name: 'Erika', description: 'Defeat Erika' },
  { name: 'Koga', description: 'Defeat Koga' },
  { name: 'Sabrina', description: 'Defeat Sabrina' },
  { name: 'Blaine', description: 'Defeat Blaine' },
  { name: 'Giovanni', description: 'Defeat Giovanni' },
  { name: 'Rival 3', description: 'Victory Road rival battle' },
  { name: 'Elite Four', description: 'Enter Elite Four' },
  { name: 'Champion', description: 'Defeat Champion' },
] as const;

// Button sequence for common actions (helps AI learn patterns)
export const COMMON_SEQUENCES = {
  skipDialogue: ['A', 'A', 'A'],
  openMenu: ['START'],
  selectYes: ['A'],
  selectNo: ['B'],
  runFromBattle: ['RIGHT', 'RIGHT', 'A'],
  useMove1: ['A', 'A'],
  useMove2: ['DOWN', 'A', 'A'],
  useMove3: ['DOWN', 'DOWN', 'A', 'A'],
  useMove4: ['DOWN', 'DOWN', 'DOWN', 'A', 'A'],
} as const;

// Important control notes for AI
export const CONTROL_NOTES = {
  directionalKeysOnly: `UP/DOWN/LEFT/RIGHT are DIRECTIONAL ONLY.
They move your character in the overworld and move the menu cursor.
They do NOT confirm, select, delete, or advance a choice by themselves.
IMPORTANT: To MOVE in a direction, you may need to press that direction TWICE — once to face the direction, and once again to step forward.`,

  confirmCancelStart: `Core buttons:
- A = confirm/select/advance text/interact (talk, sign, item).
- B = cancel/back/close menus (also can speed up some text).
- START = open the main menu (and is also used to jump to "OK/END" on some naming screens).
Never "confirm" a menu choice with arrows; always use A.`,

  waitOption: `WAIT means no button press. Use WAIT during animations, screen fades, NPC movement, battle text scrolling, and transitions.
If the screen is changing on its own, WAIT instead of spamming buttons.`,

interactionVsTraversal: `Traversal vs interaction:
  - Doors, stair tiles, ladders: WALK INTO them (no A).
  - NPCs, signs, items on the ground: face them and press A.
  If you pressed A 2-3 times and keep getting the same sign/dialogue, stop and reposition or press B to exit.
  
  IMPORTANT: After completing a dialog, do NOT press A again. Pressing A will restart the interaction and reset your position to face the NPC/sign. Instead, MOVE AWAY immediately after dialog ends.
  
  STAIRS: To go up or down stairs, you WALK ONTO the stair tile. Do NOT press UP or DOWN arrow to use stairs - just walk into them like a door. The game will automatically move you to the next floor.`,

  blackAreasInsideBuildings: `Inside buildings/caves, BLACK/DARK tiles are almost always WALLS/boundary (not exits).
If movement into a dark area fails 2-3 times, it is a wall—choose another direction.`,

  facingThenMoving: `MOVEMENT REQUIRES TWO INPUTS:
A single direction press TURNS you to face that direction but may NOT move you.
To move one tile, you often need TWO presses of the same direction:
  1st press = face that direction
  2nd press = step in that direction
If you press LEFT once and nothing changes visually, press LEFT AGAIN to actually move.
When exploring, keep pressing the SAME direction 3-5 times to ensure you actually move, not just turn.`,

  doorsAndStairs: `Doors & stairs:
You do NOT press A to use them.
Walk onto the door/stair tile to trigger it.
If you are "stuck" at an exit, you are probably not aligned with the doorway tile—move one step left/right/up/down and try walking into it again.`,

  menuNavigation: `Menu navigation:
- Use UP/DOWN to highlight options, A to select.
- Use B to back out.
If you are uncertain what a menu option does, press B and leave the menu rather than selecting.`,

  battleMenuBasics: `Battle menus:
- Fight/Bag/Pokémon/Run are selected with cursor + A.
- Most turn choices require A twice: A to pick "Fight", then A to pick the move.
If you intend to run, select "Run" with cursor then press A (do not mash arrows).`,

  textEntryNavigation: `Naming/text entry screens:
Letters are in a GRID. Use UP/DOWN/LEFT/RIGHT to highlight a letter. A highlighted letter is NOT selected until you press A.
Speed tip: names can be ONE LETTER.
To confirm quickly: press START to jump to "END/OK", then IMMEDIATELY press A to confirm.
Important: the confirm must be START -> A with nothing in between. If you press any other button, do START -> A again.
RULE: Do NOT waste time editing names or correcting misspellings. Accept whatever name is there or use a single letter. Names do not matter for progress.`,

  exploreGoal: `EXPLORE GOAL:
When you do not have a clear objective, your job is to reveal the map and find progress triggers.

EXPLORATION TAKES TIME. Do NOT expect immediate progress. Thoroughly exploring a single room may take 20-50 button presses. This is NORMAL. Be patient.

Priority targets while exploring:
1) Exits (doors, stairs, cave entrances, route gates) - check ALL FOUR walls, not just bottom
2) NPCs that block paths or look important (stand alone, face you, guard posts)
3) Interactable objects (bookshelves, PCs, TVs, posters) - press A to interact
4) Signs (often explain where to go)
5) Items on the ground (Poké Balls/items)

After checking something once, do not spam it—move on. Explore the entire room and interact with its contents before leaving. DOWN does not guarantee exit.`,

  wallHugNavigation: `WALL HUG (maze/cave navigation):
If you are in a maze-like area (cave, forest, complex building) and get lost, use wall-hugging.

MOVEMENT REMINDER: Moving requires TWO inputs - first press faces that direction, second press moves. Press the same direction multiple times to keep moving.

Algorithm:
1. Decide CLOCKWISE or ANTI-CLOCKWISE and COMMIT to it for 30+ steps
2. Pick your starting direction based on rotation:
   - Anti-clockwise order: LEFT -> DOWN -> RIGHT -> UP -> LEFT...
   - Clockwise order: RIGHT -> DOWN -> LEFT -> UP -> RIGHT...
3. Press the SAME direction REPEATEDLY (5-10 times) until you get [NO CHANGE] 2-3 times
   - Do NOT switch after just 1-2 presses - you may still be facing, not moving
   - Keep pressing until you are CERTAIN you hit a wall
   - If you keep getting DIALOGS when pressing a direction, that direction is BLOCKED (you're hitting a sign/NPC) - treat it like a wall
4. Only THEN rotate to the NEXT direction in your sequence
5. Repeat: press new direction 5-10 times until blocked, then rotate again

CRITICAL: Exploration takes time. Do NOT expect immediate progress. You are mapping the area.
Write to Notes: "Wall hug: [clockwise/anti-clockwise], current direction: [dir], presses in this dir: [count]"

Do this consistently for 30-60 steps. Do NOT alternate randomly or give up early.`,

  perimeterScan: `PERIMETER SCAN (find exits in rooms/buildings):
If you enter a room/building and cannot find the exit quickly:

MOVEMENT REMINDER: Moving requires TWO inputs - first press faces that direction, second press moves. You may need to press the same direction twice to move one tile.

Algorithm:
1. Pick a wall to start (any wall)
2. Pick a rotation direction (clockwise or anti-clockwise) and COMMIT to it
3. Move along the wall in your chosen direction:
   - Keep pressing the SAME direction multiple times until you hit a wall ([NO CHANGE] 2-3 times)
   - Do NOT switch directions prematurely after just 1-2 presses
   - If you keep getting DIALOGS when pressing a direction, that direction is BLOCKED - treat it like a wall
4. When you hit a corner, rotate to the next direction in your rotation order
5. Continue tracing until you've checked ALL four walls
6. When you see a door/stair tile, WALK INTO it (no A)
7. INTERACT (press A) with objects, bookshelves, PCs, NPCs along the way

CRITICAL: DOWN DOES NOT ALLOW YOU TO EXIT ROOMS. Doors can be on ANY wall. You MUST check all four walls.
Write to Notes: "Perimeter scan: [clockwise/anti-clockwise], currently on [wall], moving [direction]"`,

  stuckRecovery: `STUCK RECOVERY PROTOCOL:
If you feel stuck or are making no progress:

1. STOP and assess: What have you already tried? Write it to your Notes.
2. Switch strategy:
   - Indoors: Use PERIMETER SCAN - trace ALL walls, check ALL sides for exits
   - Maze/Cave: Use WALL HUG - pick clockwise or anti-clockwise and commit
3. Track in Notes: "Attempting stuck recovery. Tried: [list actions]. Now using: [strategy]"
4. If pressing same direction gets [NO CHANGE] 3+ times, that direction is BLOCKED
5. If dialog/menu loops: press B to exit, move AWAY at least 2 tiles before retrying

IMPORTANT: Write to your Notes what specific actions you have attempted to get unstuck. Be detailed: "Tried UP 3x (blocked), tried LEFT 2x (blocked), tried interacting with bookshelf (nothing)". This helps avoid repeating failed attempts.

Remember: DOWN does not guarantee exit. Exits can be on ANY wall.`,

  visualInterpretationWarning: `VISUAL INTERPRETATION WARNING:
Do NOT fully trust your visual interpretation of the room and its contents. GBA graphics can be ambiguous:
- What looks like a path might be a wall
- What looks like an NPC might be decoration  
- What looks like an exit might be blocked
- Shadows and perspective can be misleading
If your action has NO EFFECT, reconsider your interpretation of what you're seeing. The game state, not your visual assumption, determines what's possible.`,
} as const;

// Basic gamer intelligence rules - avoid common AI mistakes
export const GAMER_INTELLIGENCE_RULES = [
  // Loop prevention
  'If the same action produces the same result 2–3 times in a row, STOP and change strategy. Do not brute-force repetition.',
  'Never repeat identical input sequences when the screen state has not changed. Adjust position, direction, or context first.',

  // Movement & navigation
  'If movement input results in [NO CHANGE] three times in a row, you are blocked by a wall, object, NPC, or boundary. Change direction.',
  'Remember: to MOVE in a direction you may need to press that direction TWICE — once to face the direction, and once again to step forward.',
  'You CANNOT walk through walls. Progress requires doors, stairs, ladders, bridges, or map exits.',
  'If forward progress is blocked, step back one tile, re-align your character, and try approaching the target from a different angle.',
  'If lost in a complex area, switch to WALL HUG or PERIMETER SCAN navigation instead of random walking.',

  // Interaction logic
  'If pressing A repeatedly shows the same dialogue, you are not making progress. Press B to exit and reposition.',
  'If dialogue keeps appearing after pressing A multiple times, you may be in a loop. Press B to exit AND move at least one tile in a DIFFERENT direction than the one that triggered the dialogue before trying again.',
  'If interacting with an object or NPC does nothing useful after multiple attempts, move on and explore other targets.',
  'Do not assume every visible object is interactive. If A produces no change, deprioritize that object.',

  // Menu behavior
  'If a menu option is greyed out or unavailable, do not attempt to select it repeatedly. Choose a valid option or exit the menu.',
  'If unsure what a menu option does, press B and back out instead of randomly confirming.',
  'Never confirm destructive or irreversible actions (delete, overwrite, reset) without explicit instruction.',

  // Exploration strategy
  'If progress is unclear, prioritize discovering exits, doors, staircases, and route transitions before farming battles.',
  'Avoid wandering randomly for long periods. Use structured exploration: perimeter scan indoors, wall hugging in mazes.',
  'After fully exploring one direction or room, do not immediately return and repeat it unless something has changed.',

  // Battle logic
  'If a move consistently misses, is ineffective, or deals negligible damage, switch moves or switch Pokémon.',
  'Avoid attacking into immunity (0x effectiveness). Always choose a move that can deal damage.',
  'If HP becomes low and damage output is poor, prioritize switching Pokémon or using items instead of continuing attacks.',
  'Do not waste PP on obviously bad moves when better options exist.',

  // Visual awareness
  'Always observe the screen after each action. If nothing changes visually, assume the action had no effect.',
  'Use visual cues (open paths, door tiles, stair graphics, NPC orientation) to guide decisions instead of random input.',

  // Recovery logic
  'If you feel stuck or confused, reset your mental state: stop input, observe the environment, then re-evaluate objectives.',
  'When repeated failures occur, switch to EXPLORE GOAL mode and search for new paths or information sources.',

  // Efficiency mindset
  'Do not over-optimize small actions while ignoring major objectives. Prioritize progression over perfection.',
  'Avoid unnecessary backtracking unless required by story progression or item retrieval.',
] as const;

// Game manual and resources
export const GAME_RESOURCES = {
  manualPdf: 'https://ziajgo1fa4mooxyp.public.blob.vercel-storage.com/2026/leafgreen-manual.pdf',
} as const;

/**
 * RL-BASED REWARD FUNCTIONS
 * Based on insights from Pokemon Red RL paper (arxiv:2502.19920)
 * and PokemonRedExperiments by Peter Whidden
 * 
 * Key learnings:
 * 1. Dense auxiliary rewards needed for long horizons
 * 2. Event rewards (+2) for milestones
 * 3. Navigation rewards for exploration (+0.005 per new coordinate)
 * 4. Healing rewards proportional to HP restoration
 * 5. Level rewards with diminishing returns above threshold
 */

// Milestone reward values (from paper: +2 for events)
export const MILESTONE_REWARDS: Record<string, number> = {
  starter_chosen: 2,
  rival_1_defeated: 2,
  viridian_forest_entered: 1,
  viridian_forest_exited: 2,
  brock_defeated: 5, // Gym leaders worth more
  mt_moon_entered: 1,
  mt_moon_exited: 3, // Cave exits worth more (hard navigation)
  cerulean_reached: 2,
  misty_defeated: 5,
  bill_quest_complete: 3,
  vermilion_reached: 2,
  lt_surge_defeated: 5,
  rock_tunnel_exited: 3,
  celadon_reached: 2,
  erika_defeated: 5,
  koga_defeated: 5,
  sabrina_defeated: 5,
  blaine_defeated: 5,
  giovanni_defeated: 5,
  elite_four_entered: 10,
  champion_defeated: 50,
};

// Calculate event reward for completing a milestone
export function calculateEventReward(milestone: GameMilestone): number {
  return MILESTONE_REWARDS[milestone] || 2;
}

// Calculate navigation reward for exploring new coordinates
// From paper: R_nav = +0.005 for each new coordinate
export function calculateNavigationReward(
  newLocation: string,
  visitedLocations: Set<string>
): { reward: number; isNew: boolean } {
  if (visitedLocations.has(newLocation)) {
    return { reward: 0, isNew: false };
  }
  return { reward: 0.005, isNew: true };
}

// Calculate healing reward based on HP restoration
// From paper: R_heal = 2.5 * sum((HP_after - HP_before) / HP_max)
export function calculateHealingReward(
  partyBefore: PartyPokemon[],
  partyAfter: PartyPokemon[]
): number {
  if (partyBefore.length === 0 || partyAfter.length === 0) return 0;
  
  let hpGainFraction = 0;
  for (let i = 0; i < Math.min(partyBefore.length, partyAfter.length); i++) {
    const before = partyBefore[i];
    const after = partyAfter[i];
    if (after.maxHP > 0) {
      const hpGain = Math.max(0, after.currentHP - before.currentHP);
      hpGainFraction += hpGain / after.maxHP;
    }
  }
  
  return 2.5 * hpGainFraction;
}

// Calculate level reward with diminishing returns above threshold
// From paper: R_lvl = 0.5 * min(sum(levels), (sum(levels) - 22) / 4 + 22)
export function calculateLevelReward(
  party: PartyPokemon[],
  threshold = 22
): number {
  const totalLevels = party.reduce((sum, p) => sum + p.level, 0);
  
  // Diminishing returns above threshold
  const effectiveLevels = Math.min(
    totalLevels,
    (totalLevels - threshold) / 4 + threshold
  );
  
  return 0.5 * effectiveLevels;
}

// Calculate total reward for current state transition
export function calculateTotalReward(
  prevState: GameState,
  newState: GameState,
  newMilestone?: GameMilestone
): number {
  let totalReward = 0;
  
  // Event reward for milestone
  if (newMilestone && !prevState.progressMetrics.completedMilestones.includes(newMilestone)) {
    totalReward += calculateEventReward(newMilestone);
  }
  
  // Navigation reward for new area
  if (newState.currentArea !== prevState.currentArea) {
    const locationKey = newState.currentArea;
    const navReward = calculateNavigationReward(
      locationKey,
      prevState.progressMetrics.locationsThisEpisode
    );
    totalReward += navReward.reward;
  }
  
  // Healing reward
  if (newState.party.length > 0 && prevState.party.length > 0) {
    totalReward += calculateHealingReward(prevState.party, newState.party);
  }
  
  // Level reward (differential)
  const prevLevelReward = calculateLevelReward(prevState.party);
  const newLevelReward = calculateLevelReward(newState.party);
  totalReward += Math.max(0, newLevelReward - prevLevelReward);
  
  return totalReward;
}

// Detect if player is stuck based on consecutive no-change actions
export function detectStuckState(
  consecutiveNoChange: number,
  lastActions: string[]
): { isStuck: boolean; stuckType: string | null } {
  // More than 3 no-change in a row = likely stuck
  if (consecutiveNoChange >= 3) {
    // Check if repeatedly pressing same direction
    const recentDirections = lastActions.filter(a => 
      ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(a)
    );
    if (recentDirections.length >= 3) {
      const allSame = recentDirections.every(d => d === recentDirections[0]);
      if (allSame) {
        return { isStuck: true, stuckType: 'wall_collision' };
      }
    }
    
    // Check if repeatedly pressing A (dialogue loop)
    const recentA = lastActions.filter(a => a === 'A');
    if (recentA.length >= 3) {
      return { isStuck: true, stuckType: 'dialogue_loop' };
    }
    
    return { isStuck: true, stuckType: 'unknown' };
  }
  
  return { isStuck: false, stuckType: null };
}

// Determine priority action based on current game state
export function determinePriorityAction(state: GameState): {
  priority: 'explore' | 'battle' | 'heal' | 'progress' | 'escape';
  reasoning: string;
} {
  // Low HP = prioritize healing or escaping
  if (state.totalPartyHP < 30) {
    if (state.inBattle) {
      return { priority: 'escape', reasoning: 'Party HP critical, should escape battle' };
    }
    return { priority: 'heal', reasoning: 'Party HP low, should find Pokemon Center' };
  }
  
  // In battle = focus on battle
  if (state.inBattle) {
    return { priority: 'battle', reasoning: 'Currently in battle, should fight strategically' };
  }
  
  // In dialogue = advance it
  if (state.inDialogue) {
    return { priority: 'progress', reasoning: 'In dialogue, should advance or exit' };
  }
  
  // In menu = likely intentional, progress through it
  if (state.inMenu) {
    return { priority: 'progress', reasoning: 'In menu, should navigate or exit' };
  }
  
  // Default = explore toward next milestone
  return { priority: 'explore', reasoning: 'Should explore toward next objective' };
}

// Simple hash function for frame comparison (fast, not cryptographic)
export function simpleFrameHash(dataUrl: string): string {
  const base64 = dataUrl.split(',')[1] || '';
  let hash = 0;
  for (let i = 0; i < base64.length; i += 1000) {
    hash = ((hash << 5) - hash) + base64.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Frame history entry with change detection
export interface FrameHistoryEntry {
  button: string;
  reasoning: string;
  timestamp: number;
  frameHash: string;
  visualChange: 'no_change' | 'change_detected' | 'first_frame';
}

// Helper to format command history with visual change indicators and reasoning
export function formatCommandHistoryWithChanges(
  history: FrameHistoryEntry[],
  maxCount = 25
): string {
  const recent = history.slice(-maxCount);
  if (recent.length === 0) return 'No previous commands';
  
  const formatted = recent.map((entry, index) => {
    const changeIndicator = entry.visualChange === 'change_detected' 
      ? '[SCREEN CHANGED]' 
      : entry.visualChange === 'first_frame' 
        ? '[START]' 
        : '[NO CHANGE]';
    const reasoning = entry.reasoning ? ` - ${entry.reasoning}` : '';
    return `${index + 1}. ${entry.button} ${changeIndicator}${reasoning}`;
  });
  
  return formatted.join('\n');
}

// Helper to format last N commands as a simple summary (no reasoning)
export function formatCommandHistory(
  decisions: Array<{ button: string; reasoning?: string; timestamp?: number }>,
  maxCount = 25
): string {
  const recent = decisions.slice(-maxCount);
  if (recent.length === 0) return 'No previous commands';
  
  const grouped: string[] = [];
  let currentButton = '';
  let count = 0;
  
  for (const d of recent) {
    if (d.button === currentButton) {
      count++;
    } else {
      if (currentButton) {
        grouped.push(count > 1 ? `${currentButton}x${count}` : currentButton);
      }
      currentButton = d.button;
      count = 1;
    }
  }
  if (currentButton) {
    grouped.push(count > 1 ? `${currentButton}x${count}` : currentButton);
  }
  
  return grouped.join(' -> ');
}
