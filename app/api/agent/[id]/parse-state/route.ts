import { NextResponse } from 'next/server';
import { list, head } from '@vercel/blob';
import { parseSaveState, formatGameStateForPrompt } from '@/lib/save-state';

/**
 * GET /api/agent/[id]/parse-state
 * Parse the most recent save state for an agent
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // List save states for this agent
    const { blobs } = await list({
      prefix: `save-states/${id}/`,
    });
    
    if (blobs.length === 0) {
      return NextResponse.json({ 
        error: 'No save states found',
        parsed: null,
        formatted: null,
      });
    }
    
    // Get most recent (last in list sorted by name which includes timestamp)
    const latest = blobs[blobs.length - 1];
    
    // Fetch the blob data
    const response = await fetch(latest.url);
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch save state',
        parsed: null,
        formatted: null,
      });
    }
    
    const data = await response.arrayBuffer();
    
    // Parse the save state
    const parsed = await parseSaveState(data);
    
    if (!parsed) {
      return NextResponse.json({ 
        error: 'Failed to parse save state - format unrecognized',
        blobUrl: latest.url,
        blobSize: data.byteLength,
        parsed: null,
        formatted: null,
      });
    }
    
    return NextResponse.json({
      success: true,
      blobUrl: latest.url,
      blobSize: data.byteLength,
      parsed,
      formatted: formatGameStateForPrompt(parsed),
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
      parsed: null,
      formatted: null,
    }, { status: 500 });
  }
}
