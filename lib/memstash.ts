import { redis, keys } from './redis';

// Structured notes schema
export interface StructuredNotes {
  currentObjective?: string | null;
  lastKnownLocation?: string | null;
  exitFound?: string | null;
  stuckMode?: 'none' | 'perimeter_scan' | 'wall_hug' | 'backtrack' | null;
  failedAttempts?: string[] | null;
  importantDiscovery?: string | null;
  general?: string | null; // Free-form notes for anything else
  // Legacy text field for backwards compatibility
  _legacyText?: string;
}

// Max characters to include in prompt prefix
export const MEMSTASH_PROMPT_LIMIT = 1000;

// Max total characters stored (allow more for full history)
export const MEMSTASH_MAX_TOTAL = 5000;

/**
 * Get the structured notes for an agent
 */
export async function getStructuredNotes(agentId: string): Promise<StructuredNotes> {
  try {
    const content = await redis.get(keys.agentMemStash(agentId));
    if (!content) return {};
    // Try to parse as structured notes
    if (typeof content === 'object') return content as StructuredNotes;
    // Legacy string format - wrap in _legacyText
    if (typeof content === 'string') return { _legacyText: content };
    return {};
  } catch (_error) {
    return {};
  }
}

/**
 * Get the memStash content for an agent (legacy string format)
 */
export async function getMemStash(agentId: string): Promise<string> {
  try {
    const content = await redis.get(keys.agentMemStash(agentId));
    if (!content) return '';
    // If structured, convert to readable string
    if (typeof content === 'object') {
      return formatNotesForPrompt(content as StructuredNotes);
    }
    return (content as string) || '';
  } catch (_error) {
    return '';
  }
}

/**
 * Format structured notes as readable text for prompt
 */
function formatNotesForPrompt(notes: StructuredNotes): string {
  const lines: string[] = [];
  if (notes.currentObjective) lines.push(`Objective: ${notes.currentObjective}`);
  if (notes.lastKnownLocation) lines.push(`Location: ${notes.lastKnownLocation}`);
  if (notes.exitFound) lines.push(`Exit: ${notes.exitFound}`);
  if (notes.stuckMode && notes.stuckMode !== 'none') lines.push(`Recovery mode: ${notes.stuckMode}`);
  if (notes.failedAttempts?.length) lines.push(`Failed: ${notes.failedAttempts.join(', ')}`);
  if (notes.importantDiscovery) lines.push(`Important: ${notes.importantDiscovery}`);
  if (notes.general) lines.push(`Notes: ${notes.general}`);
  if (notes._legacyText) lines.push(notes._legacyText);
  return lines.join('\n');
}

/**
 * Merge new notes with existing structured notes
 * Arrays (like failedAttempts) are appended, other fields are overwritten
 */
export async function mergeStructuredNotes(agentId: string, newNotes: StructuredNotes): Promise<void> {
  if (!newNotes || Object.keys(newNotes).length === 0) return;
  
  try {
    const existing = await getStructuredNotes(agentId);
    
    // Merge: new values overwrite, but arrays append
    const merged: StructuredNotes = { ...existing };
    
    if (newNotes.currentObjective !== undefined) merged.currentObjective = newNotes.currentObjective;
    if (newNotes.lastKnownLocation !== undefined) merged.lastKnownLocation = newNotes.lastKnownLocation;
    if (newNotes.exitFound !== undefined) merged.exitFound = newNotes.exitFound;
    if (newNotes.stuckMode !== undefined) merged.stuckMode = newNotes.stuckMode;
    if (newNotes.importantDiscovery !== undefined) merged.importantDiscovery = newNotes.importantDiscovery;
    if (newNotes.general !== undefined) merged.general = newNotes.general;
    
    // Failed attempts: append and keep last 5
    if (newNotes.failedAttempts?.length) {
      const existingAttempts = merged.failedAttempts || [];
      merged.failedAttempts = [...existingAttempts, ...newNotes.failedAttempts].slice(-5);
    }
    
    await redis.set(keys.agentMemStash(agentId), merged);
  } catch (_error) {
    // Failed to merge notes
  }
}

/**
 * Prepend to memStash (legacy string format - for backwards compatibility)
 */
export async function appendMemStash(agentId: string, content: string | StructuredNotes): Promise<void> {
  // Handle structured notes
  if (typeof content === 'object') {
    await mergeStructuredNotes(agentId, content);
    return;
  }
  
  // Legacy string handling
  if (!content || !content.trim()) return;
  
  try {
    const existing = await getStructuredNotes(agentId);
    const timestamp = new Date().toISOString().slice(11, 19);
    const newEntry = `[${timestamp}] ${content.trim()}`;
    
    // Append to legacy text
    const legacyText = existing._legacyText || '';
    let updated = legacyText ? `${newEntry}\n${legacyText}` : newEntry;
    
    if (updated.length > MEMSTASH_MAX_TOTAL) {
      const lines = updated.split('\n');
      while (updated.length > MEMSTASH_MAX_TOTAL && lines.length > 1) {
        lines.pop();
        updated = lines.join('\n');
      }
    }
    
    existing._legacyText = updated;
    await redis.set(keys.agentMemStash(agentId), existing);
  } catch (_error) {
    // Failed to append
  }
}

/**
 * Clear memStash for an agent
 */
export async function clearMemStash(agentId: string): Promise<void> {
  try {
    await redis.del(keys.agentMemStash(agentId));
  } catch (error) {
    // console.error(`[memstash] Failed to clear memStash for ${agentId}:`, error);
  }
}

/**
 * Get memStash content truncated for prompt inclusion
 * Most recent notes are at the top, so truncate from end if needed
 */
export async function getMemStashForPrompt(agentId: string): Promise<string> {
  const content = await getMemStash(agentId);
  if (!content) return '';
  
  // Most recent at top, so take first N characters
  if (content.length <= MEMSTASH_PROMPT_LIMIT) {
    return content;
  }
  
  // Truncate from end (keep most recent at top), try to break at newline
  const truncated = content.slice(0, MEMSTASH_PROMPT_LIMIT);
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > MEMSTASH_PROMPT_LIMIT - 100) {
    return truncated.slice(0, lastNewline);
  }
  return truncated;
}

/**
 * Get full decision log indexed by step
 */
export async function getDecisionLog(agentId: string): Promise<Array<{ step: number; button: string; reasoning: string; timestamp: number }>> {
  try {
    const log = await redis.get(keys.agentDecisionLog(agentId));
    return (log as Array<{ step: number; button: string; reasoning: string; timestamp: number }>) || [];
  } catch (error) {
    // console.error(`[memstash] Failed to get decision log for ${agentId}:`, error);
    return [];
  }
}

/**
 * Append to decision log
 */
export async function appendDecisionLog(
  agentId: string, 
  decision: { button: string; reasoning: string }
): Promise<number> {
  try {
    const log = await getDecisionLog(agentId);
    const step = log.length + 1;
    
    log.push({
      step,
      button: decision.button,
      reasoning: decision.reasoning,
      timestamp: Date.now(),
    });
    
    // Keep last 500 decisions
    const trimmed = log.slice(-500);
    await redis.set(keys.agentDecisionLog(agentId), trimmed);
    
    return step;
  } catch (error) {
    // console.error(`[memstash] Failed to append decision log for ${agentId}:`, error);
    return 0;
  }
}

/**
 * Clear decision log for an agent
 */
export async function clearDecisionLog(agentId: string): Promise<void> {
  try {
    await redis.del(keys.agentDecisionLog(agentId));
  } catch (error) {
    // console.error(`[memstash] Failed to clear decision log for ${agentId}:`, error);
  }
}
