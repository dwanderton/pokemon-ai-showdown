import type { AgentState, ModelId } from '@/lib/types/agent';
import { AGENT_PERSONALITIES } from '@/lib/types/agent';

// Create initial agent state on the client
// This is a pure function that can be used in useState initializers
export function createClientAgentState(
  agentId: string,
  modelId: ModelId
): AgentState {
  const personality = AGENT_PERSONALITIES[agentId] || AGENT_PERSONALITIES['agent-1'];
  
  return {
    id: agentId,
    modelId,
    personality,
    status: 'idle',
    gameState: {
      currentArea: 'Unknown',
      inBattle: false,
      inMenu: false,
      inDialogue: false,
      pokemonCount: 0,
      partyHealth: [],
      badges: 0,
      playtime: '0:00',
      lastAction: null,
      lastActionResult: 'Game starting...',
    },
    decisions: [],
    lastDecision: null,
    totalDecisions: 0,
    totalCost: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    fallbackCount: 0,
    startedAt: null,
    lastUpdatedAt: null,
    badges: 0,
    badgeTimestamps: [],
    costPerBadge: [],
  };
}
