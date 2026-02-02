export const GBA_MEMORY = {
  EWRAM_START: 0x02000000,  // External Work RAM (256KB)
  EWRAM_END: 0x02030000,
  IWRAM_START: 0x03000000,  // Internal Work RAM (32KB)
  IWRAM_END: 0x03007FFF,
};

// Pokemon structure offsets (within 100-byte Pokemon data block)
export const POKEMON_STRUCT = {
  SIZE: 100, // bytes per Pokemon
  // Offsets within battle Pokemon structure
  SPECIES: 0x00,      // 2 bytes
  CURRENT_HP: 0x28,   // 2 bytes  
  MAX_HP: 0x2A,       // 2 bytes
  LEVEL: 0x54,        // 1 byte (in party, offset varies in battle)
};

// Fixed EWRAM addresses (Pokemon LeafGreen/FireRed)
export const LEAFGREEN_RAM = {
  // Party Pokemon (battle expanded format - 100 bytes each)
  PARTY_POKEMON_1: 0x02024284,
  PARTY_POKEMON_2: 0x020242E8,
  PARTY_POKEMON_3: 0x0202434C,
  PARTY_POKEMON_4: 0x020243B0,
  PARTY_POKEMON_5: 0x02024414,
  PARTY_POKEMON_6: 0x02024478,
  
  // Enemy Pokemon (in battle)
  ENEMY_POKEMON_1: 0x0202402C,
  ENEMY_POKEMON_2: 0x02024090,
  
  // Player info
  PLAYER_NAME: 0x020245CC,        // 8 bytes
  RIVAL_NAME: 0x02028F78,         // 8 bytes
  
  // Map info (fixed)
  CURRENT_MAP_BANK: 0x02031DBC,   // 1 byte
  CURRENT_MAP_NUM: 0x02031DBD,    // 1 byte
  MAP_HEADER: 0x02036DFC,         // Map header pointer
  
  // Player state
  PLAYER_OW: 0x02036E38,          // 36 bytes - overworld player data
  PLAYER_SPEED: 0x02037078,       // 1 byte
  PLAYER_MOVING: 0x0203707B,      // 1 byte - is player moving?
  MOVEMENT_LOCKED: 0x0203707E,    // 1 byte - all OW movement locked
  
  // Script variables
  SCRIPT_VAR_8000: 0x020370B8,    // 2 bytes
  
  // Battle state
  BATTLE_TYPE: 0x020386AC,        // 2 bytes
  
  // Dialog/menu
  DIALOG_BOX_1: 0x020204B4,       // 12 bytes
  STRING_BUFFER_0: 0x02021CD0,    // 32 bytes
  STRING_BUFFER_1: 0x02021CF0,    // 20 bytes
  
  // Screen fade
  SCREEN_FADING: 0x03000F9C,      // 1 byte (IWRAM)
  
  // Cursor
  CURSOR_POSITION: 0x0203ADE6,    // 1 byte
};

// Pointers to DMA-protected save blocks (IWRAM)
export const SAVE_POINTERS = {
  MAP_DATA: 0x03005008,           // Pointer to map/camera data
  PERSONAL_DATA: 0x0300500C,      // Pointer to trainer/party data
  BOX_DATA: 0x03005010,           // Pointer to PC box data
};

// Offsets from MAP_DATA pointer ([0x03005008] + offset)
export const MAP_DATA_OFFSETS = {
  CAMERA_X: 0x0000,               // 2 bytes
  CAMERA_Y: 0x0002,               // 2 bytes
  MAP_NUM: 0x0004,                // 1 byte
  MAP_BANK: 0x0005,               // 1 byte
};

// Offsets from PERSONAL_DATA pointer ([0x0300500C] + offset)
export const PERSONAL_DATA_OFFSETS = {
  TRAINER_NAME: 0x0000,           // 8 bytes
  GENDER: 0x0008,                 // 1 byte (0=male, 1=female)
  TRAINER_ID: 0x000A,             // 2 bytes
  SECRET_ID: 0x000C,              // 2 bytes
  PLAYTIME_HOURS: 0x000E,         // 2 bytes
  PLAYTIME_MINUTES: 0x0010,       // 1 byte
  PLAYTIME_SECONDS: 0x0011,       // 1 byte
  MONEY_HIDDEN: 0x0218,           // 4 bytes (XOR encrypted)
  MONEY_KEY: 0x0F20,              // 4 bytes (XOR key)
  // Badges are stored in event flags, need separate lookup
};

// Map IDs for milestone detection
export const MAP_IDS = {
  PALLET_TOWN: { bank: 0, map: 0 },
  VIRIDIAN_CITY: { bank: 0, map: 1 },
  PEWTER_CITY: { bank: 0, map: 2 },
  CERULEAN_CITY: { bank: 0, map: 3 },
  VERMILION_CITY: { bank: 0, map: 6 },
  CELADON_CITY: { bank: 0, map: 7 },
  FUCHSIA_CITY: { bank: 0, map: 8 },
  VIRIDIAN_FOREST: { bank: 3, map: 60 }, // Approximate
  MT_MOON: { bank: 3, map: 1 },
  POKEMON_LEAGUE: { bank: 0, map: 11 },
};

// Pokemon character encoding (Generation 3)
export const GEN3_CHAR_MAP: Record<number, string> = {
  0x00: ' ', 0xAB: '!', 0xAC: '?', 0xAD: '.', 0xAE: '-',
  0xB0: '...', 0xB1: '"', 0xB2: '"', 0xB3: "'", 0xB4: "'",
  0xB5: 'M', 0xB6: 'F', 0xB7: '$', 0xB8: ',', 0xB9: '*',
  0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E',
  0xC0: 'F', 0xC1: 'G', 0xC2: 'H', 0xC3: 'I', 0xC4: 'J',
  0xC5: 'K', 0xC6: 'L', 0xC7: 'M', 0xC8: 'N', 0xC9: 'O',
  0xCA: 'P', 0xCB: 'Q', 0xCC: 'R', 0xCD: 'S', 0xCE: 'T',
  0xCF: 'U', 0xD0: 'V', 0xD1: 'W', 0xD2: 'X', 0xD3: 'Y',
  0xD4: 'Z', 0xD5: 'a', 0xD6: 'b', 0xD7: 'c', 0xD8: 'd',
  0xD9: 'e', 0xDA: 'f', 0xDB: 'g', 0xDC: 'h', 0xDD: 'i',
  0xDE: 'j', 0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n',
  0xE3: 'o', 0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's',
  0xE8: 't', 0xE9: 'u', 0xEA: 'v', 0xEB: 'w', 0xEC: 'x',
  0xED: 'y', 0xEE: 'z', 0xF1: '0', 0xF2: '1', 0xF3: '2',
  0xF4: '3', 0xF5: '4', 0xF6: '5', 0xF7: '6', 0xF8: '7',
  0xF9: '8', 0xFA: '9', 0xFF: '', // Terminator
};

/**
 * Decode a Gen3 Pokemon string from bytes
 */
export function decodeGen3String(bytes: Uint8Array): string {
  let result = '';
  for (const byte of bytes) {
    if (byte === 0xFF) break; // Terminator
    result += GEN3_CHAR_MAP[byte] || '?';
  }
  return result;
}

/**
 * Read a 16-bit little-endian value from bytes
 */
export function readU16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/**
 * Read a 32-bit little-endian value from bytes  
 */
export function readU32LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

/**
 * Parse Pokemon party data from memory
 */
export interface ParsedPokemon {
  species: number;
  currentHP: number;
  maxHP: number;
  level: number;
  hpPercent: number;
}

export function parsePokemonFromBytes(bytes: Uint8Array): ParsedPokemon | null {
  if (bytes.length < POKEMON_STRUCT.SIZE) return null;
  
  const species = readU16LE(bytes, POKEMON_STRUCT.SPECIES);
  if (species === 0 || species > 500) return null; // Invalid species
  
  const currentHP = readU16LE(bytes, POKEMON_STRUCT.CURRENT_HP);
  const maxHP = readU16LE(bytes, POKEMON_STRUCT.MAX_HP);
  // Level is at different offsets in different contexts, try common one
  const level = bytes[POKEMON_STRUCT.LEVEL] || bytes[0x54] || 1;
  
  return {
    species,
    currentHP,
    maxHP,
    level: Math.min(100, Math.max(1, level)),
    hpPercent: maxHP > 0 ? Math.round((currentHP / maxHP) * 100) : 0,
  };
}

/**
 * Game state parsed from memory
 */
export interface MemoryGameState {
  playerName: string;
  mapBank: number;
  mapNum: number;
  cameraX: number;
  cameraY: number;
  isMoving: boolean;
  movementLocked: boolean;
  screenFading: boolean;
  party: ParsedPokemon[];
  totalPartyHP: number;
  playtimeMinutes: number;
}

/**
 * Commands to send to emulator for memory reading
 */
export const MEMORY_READ_COMMANDS = {
  // Request to read party Pokemon data (6 Pokemon * 100 bytes)
  READ_PARTY: {
    type: 'READ_MEMORY',
    address: LEAFGREEN_RAM.PARTY_POKEMON_1,
    length: 600, // 6 Pokemon * 100 bytes
  },
  // Request to read map state
  READ_MAP_STATE: {
    type: 'READ_MEMORY',
    address: LEAFGREEN_RAM.CURRENT_MAP_BANK,
    length: 4,
  },
  // Request to read player state
  READ_PLAYER_STATE: {
    type: 'READ_MEMORY',
    address: LEAFGREEN_RAM.PLAYER_MOVING,
    length: 4,
  },
};
