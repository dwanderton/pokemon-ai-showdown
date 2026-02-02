import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { put, list } from '@vercel/blob';
import { redis, keys } from '@/lib/redis';

// POST /api/agent/[id]/frames - Store a frame
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    const { frame, timestamp, decisionId } = await request.json();
    
    if (!frame) {
      return NextResponse.json({ error: 'No frame provided' }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = frame.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Vercel Blob
    const blob = await put(
      `frames/${agentId}/${timestamp}-${decisionId || 'manual'}.png`,
      buffer,
      {
        access: 'public',
        contentType: 'image/png',
      }
    );

    // server-after-nonblocking: Track frame count after response
    after(async () => {
      await redis.incr(keys.agentFrames(agentId));
    });

    return NextResponse.json({
      url: blob.url,
      timestamp,
      agentId,
    });
  } catch (error) {
    // console.error(`[frames] Error storing frame for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to store frame' },
      { status: 500 }
    );
  }
}

// GET /api/agent/[id]/frames - List frames for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  try {
    const { blobs } = await list({
      prefix: `frames/${agentId}/`,
      limit: 100,
    });

    const frames = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
      size: blob.size,
    }));

    const frameCount = await redis.get<number>(keys.agentFrames(agentId)) || 0;

    return NextResponse.json({
      frames,
      totalCount: frameCount,
    });
  } catch (error) {
    // console.error(`[frames] Error listing frames for agent ${agentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to list frames' },
      { status: 500 }
    );
  }
}
