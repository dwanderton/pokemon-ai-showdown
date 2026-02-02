import { NextResponse } from 'next/server';
import { gameLoopIteration, initializeAgentState } from '@/lib/workflows/game-loop/workflow';
import type { AgentState, ModelId } from '@/lib/types/agent';
import { getMemStashForPrompt } from '@/lib/memstash';

// In-memory state store (would be Redis in production)
const agentStates = new Map<string, AgentState>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, modelId, frame, previousFrames, commandHistoryWithChanges, previousConfidenceScores, previousDialogHistory, avoidStartSelect, avoidWait, avoidB, buttonsToAvoid, bannedButtons } = body as {
      agentId: string;
      modelId: ModelId;
      frame: string; // base64 image data
      previousFrames?: string[];
      commandHistoryWithChanges?: string;
      previousConfidenceScores?: Record<string, number>;
      previousDialogHistory?: string[];
      avoidStartSelect?: boolean;
      avoidWait?: boolean;
      avoidB?: boolean;
      buttonsToAvoid?: string[];
      bannedButtons?: string[];
    };
    
    // Get notes for this agent (first 1000 chars of persistent notes)
    const notes = await getMemStashForPrompt(agentId);

    if (!agentId || !modelId || !frame) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, modelId, frame' },
        { status: 400 }
      );
    }

    // Get or create agent state
    let currentState = agentStates.get(agentId);
    if (!currentState) {
      currentState = await initializeAgentState(agentId, modelId);
      currentState.startedAt = new Date();
      agentStates.set(agentId, currentState);
    }

    // Update status to thinking
    currentState.status = 'thinking';
    agentStates.set(agentId, currentState);

    // Execute game loop iteration
    const result = await gameLoopIteration(
      { agentId, modelId, frame, previousFrames, commandHistoryWithChanges, previousConfidenceScores, previousDialogHistory, avoidStartSelect, avoidWait, avoidB, buttonsToAvoid, bannedButtons, notes },
      currentState
    );

    // Update stored state with results
    const updatedState: AgentState = {
      ...currentState,
      ...result.updatedAgentState,
      decisions: [...currentState.decisions, result.decision].slice(-100), // Keep last 100 decisions
    };
    agentStates.set(agentId, updatedState);

    return NextResponse.json({
      success: true,
      decision: result.decision,
      gameState: result.gameState,
      cost: result.cost,
      totalCost: updatedState.totalCost,
      totalDecisions: updatedState.totalDecisions,
      totalTokensIn: updatedState.totalTokensIn,
      totalTokensOut: updatedState.totalTokensOut,
    });
  } catch (error) {
    // console.error('[api:agent:decide] Game loop error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get current agent state
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json(
      { error: 'Missing agentId parameter' },
      { status: 400 }
    );
  }

  const state = agentStates.get(agentId);
  if (!state) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(state);
}
