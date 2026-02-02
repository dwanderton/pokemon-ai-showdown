import { 
  ParsedGameState, 
  PokemonData, 
  MEMORY_ADDRESSES, 
  SPECIES_NAMES, 
  MAP_NAMES 
} from './types';

// WRAM starts at this offset in GBA memory space
const WRAM_BASE = 0x02000000;
const WRAM_SIZE = 0x40000; // 256KB

/**
 * Parse a save state blob to extract game data
 * @param data - Raw save state data (may be compressed)
 */
export async function parseSaveState(data: ArrayBuffer): Promise<ParsedGameState | null> {
  try {
    // Try to decompress if zlib-compressed
    let buffer: ArrayBuffer;
    try {
      buffer = await decompressIfNeeded(data);
    } catch {
      buffer = data;
    }
    
    // Find WRAM section in save state
    const wram = findWRAMSection(buffer);
    if (!wram) {
      return null;
    }
    
    // Extract data from WRAM
    return extractGameState(wram);
  } catch (_error) {
    return null;
  }
}

/**
 * Decompress zlib-compressed data
 */
async function decompressIfNeeded(data: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(data);
  
  // Check for zlib header (0x78)
  if (bytes[0] === 0x78) {
    // Use DecompressionStream if available (modern browsers)
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate');
      const blob = new Blob([data]);
      const stream = blob.stream().pipeThrough(ds);
      const decompressed = await new Response(stream).arrayBuffer();
      return decompressed;
    }
  }
  
  // Not compressed or can't decompress
  return data;
}

/**
 * Find the WRAM section within a save state
 * mGBA save states have a specific structure with magic numbers
 */
function findWRAMSection(buffer: ArrayBuffer): DataView | null {
  const bytes = new Uint8Array(buffer);
  
  // Look for mGBA save state magic or WRAM pattern
  // mGBA uses "mGBA" magic at start
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  
  if (magic === 'mGBA') {
    // mGBA format: header + sections
    // WRAM section typically at offset after header
    // This is a simplified parser - real implementation needs full format spec
    
    // Try common offsets for WRAM in mGBA saves
    const offsets = [0x100, 0x200, 0x400, 0x800];
    for (const offset of offsets) {
      if (offset + WRAM_SIZE <= buffer.byteLength) {
        return new DataView(buffer, offset, WRAM_SIZE);
      }
    }
  }
  
  // Fallback: assume raw WRAM dump or scan for known patterns
  if (buffer.byteLength >= WRAM_SIZE) {
    return new DataView(buffer, 0, Math.min(buffer.byteLength, WRAM_SIZE));
  }
  
  return null;
}

/**
 * Extract game state from WRAM data
 */
function extractGameState(wram: DataView): ParsedGameState {
  const getAddr = (addr: number) => addr - WRAM_BASE;
  
  // Player position
  const playerX = wram.getUint16(getAddr(MEMORY_ADDRESSES.PLAYER_X), true);
  const playerY = wram.getUint16(getAddr(MEMORY_ADDRESSES.PLAYER_Y), true);
  const mapId = wram.getUint8(getAddr(MEMORY_ADDRESSES.MAP_ID));
  
  // Badges (bitfield)
  const badges = wram.getUint8(getAddr(MEMORY_ADDRESSES.BADGES));
  const badgeCount = countBits(badges);
  
  // Money (4 bytes, little-endian)
  const money = wram.getUint32(getAddr(MEMORY_ADDRESSES.MONEY), true);
  
  // Play time
  const hours = wram.getUint16(getAddr(MEMORY_ADDRESSES.PLAY_TIME_HOURS), true);
  const minutes = wram.getUint8(getAddr(MEMORY_ADDRESSES.PLAY_TIME_MINUTES));
  const seconds = wram.getUint8(getAddr(MEMORY_ADDRESSES.PLAY_TIME_SECONDS));
  const playTimeSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Party Pokemon
  const partyCount = wram.getUint8(getAddr(MEMORY_ADDRESSES.PARTY_COUNT));
  const party: PokemonData[] = [];
  
  const POKEMON_DATA_SIZE = 100; // Size of each Pokemon data structure
  for (let i = 0; i < Math.min(partyCount, 6); i++) {
    const baseAddr = getAddr(MEMORY_ADDRESSES.PARTY_DATA) + (i * POKEMON_DATA_SIZE);
    
    try {
      const species = wram.getUint16(baseAddr, true);
      const currentHp = wram.getUint16(baseAddr + 86, true); // HP offset in structure
      const maxHp = wram.getUint16(baseAddr + 88, true);
      const level = wram.getUint8(baseAddr + 84);
      
      if (species > 0 && species < 500) {
        party.push({
          species,
          speciesName: SPECIES_NAMES[species] || `Pokemon #${species}`,
          level,
          currentHp,
          maxHp,
          hpPercent: maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0,
        });
      }
    } catch {
      // Invalid Pokemon data
    }
  }
  
  return {
    player: {
      x: playerX,
      y: playerY,
      mapId,
      mapName: MAP_NAMES[mapId] || `Map ${mapId}`,
    },
    badges,
    badgeCount,
    party,
    money,
    playTimeSeconds,
  };
}

/**
 * Count set bits in a byte (for badge count)
 */
function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/**
 * Format parsed game state for AI prompt inclusion
 */
export function formatGameStateForPrompt(state: ParsedGameState): string {
  const lines = [
    `## Extracted Game State`,
    `Position: (${state.player.x}, ${state.player.y}) - ${state.player.mapName}`,
    `Badges: ${state.badgeCount}/8`,
    `Money: $${state.money.toLocaleString()}`,
    `Play Time: ${Math.floor(state.playTimeSeconds / 3600)}h ${Math.floor((state.playTimeSeconds % 3600) / 60)}m`,
    ``,
    `Party (${state.party.length} Pokemon):`,
  ];
  
  for (const pokemon of state.party) {
    lines.push(`- ${pokemon.speciesName} Lv${pokemon.level}: ${pokemon.hpPercent}% HP (${pokemon.currentHp}/${pokemon.maxHp})`);
  }
  
  return lines.join('\n');
}
