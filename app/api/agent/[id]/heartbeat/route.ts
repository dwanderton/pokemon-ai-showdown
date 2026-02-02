import { NextRequest, NextResponse } from 'next/server';
import { redis, keys, HEARTBEAT_TIMEOUT } from '@/lib/redis';

// POST /api/agent/[id]/heartbeat - Update heartbeat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    // Set heartbeat with expiration
    await redis.set(
      keys.agentHeartbeat(agentId),
      Date.now(),
      { ex: HEARTBEAT_TIMEOUT * 2 } // Keep slightly longer than timeout
    );

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    // console.error(`[heartbeat] Error for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}

// GET /api/agent/[id]/heartbeat - Check if agent is alive
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    const lastBeat = await redis.get<number>(keys.agentHeartbeat(agentId));
    
    if (!lastBeat) {
      return NextResponse.json({ alive: false, reason: 'no_heartbeat' });
    }

    const elapsed = Date.now() - lastBeat;
    const alive = elapsed < HEARTBEAT_TIMEOUT * 1000;

    return NextResponse.json({
      alive,
      lastBeat,
      elapsed,
      timeout: HEARTBEAT_TIMEOUT * 1000,
    });
  } catch (error) {
    // console.error(`[heartbeat] Error checking agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to check heartbeat' },
      { status: 500 }
    );
  }
}
