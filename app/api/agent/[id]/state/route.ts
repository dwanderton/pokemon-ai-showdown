import { NextRequest, NextResponse } from 'next/server';
import { redis, keys } from '@/lib/redis';
import type { AgentState } from '@/lib/types/agent';

// GET /api/agent/[id]/state - Get agent state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    const state = await redis.get<AgentState>(keys.agentState(agentId));
    
    if (!state) {
      return NextResponse.json({ state: null });
    }

    return NextResponse.json({ state });
  } catch (error) {
    // console.error(`[state] Error getting state for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to get state' },
      { status: 500 }
    );
  }
}

// POST /api/agent/[id]/state - Save agent state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    const state = await request.json() as AgentState;
    
    // Save state with 24 hour expiration (can be resumed within a day)
    await redis.set(keys.agentState(agentId), state, { ex: 86400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error(`[state] Error saving state for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to save state' },
      { status: 500 }
    );
  }
}

// DELETE /api/agent/[id]/state - Clear agent state
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    await redis.del(keys.agentState(agentId));
    await redis.del(keys.agentHeartbeat(agentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error(`[state] Error clearing state for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to clear state' },
      { status: 500 }
    );
  }
}
