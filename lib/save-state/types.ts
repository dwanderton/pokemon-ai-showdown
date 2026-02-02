export interface ParsedGameState {
  player: {
    x: number;
    y: number;
    mapId: number;
    mapName: string;
  };
  badges: number; // Bitfield (8 bits for 8 badges)
  badgeCount: number;
  party: PokemonData[];
  money: number;
  playTimeSeconds: number;
}

export interface PokemonData {
  species: number;
  speciesName: string;
  level: number;
  currentHp: number;
  maxHp: number;
  hpPercent: number;
}

// Pokemon FireRed/LeafGreen memory addresses (WRAM)
export const MEMORY_ADDRESSES = {
  // Player position
  PLAYER_X: 0x02025A00,
  PLAYER_Y: 0x02025A02,
  MAP_ID: 0x02025A04,
  
  // Progress
  BADGES: 0x02025B08,
  MONEY: 0x02025AB4,
  
  // Party
  PARTY_COUNT: 0x02024029,
  PARTY_DATA: 0x02024284,
  
  // Time
  PLAY_TIME_HOURS: 0x02025AA0,
  PLAY_TIME_MINUTES: 0x02025AA1,
  PLAY_TIME_SECONDS: 0x02025AA2,
} as const;

// Pokemon species names (first 151 + starters)
export const SPECIES_NAMES: Record<number, string> = {
  1: 'Bulbasaur', 2: 'Ivysaur', 3: 'Venusaur',
  4: 'Charmander', 5: 'Charmeleon', 6: 'Charizard',
  7: 'Squirtle', 8: 'Wartortle', 9: 'Blastoise',
  25: 'Pikachu', 26: 'Raichu',
  // Add more as needed
};

// Map ID to name mapping (partial)
export const MAP_NAMES: Record<number, string> = {
  0: 'Pallet Town',
  1: 'Viridian City',
  2: 'Pewter City',
  3: 'Cerulean City',
  4: 'Lavender Town',
  5: 'Vermilion City',
  6: 'Celadon City',
  7: 'Fuchsia City',
  8: 'Cinnabar Island',
  9: 'Indigo Plateau',
  10: 'Saffron City',
  // Routes
  26: 'Route 1',
  27: 'Route 2',
  28: 'Route 3',
  // Add more as needed
};
