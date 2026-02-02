import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const { saveState, decisionNumber, modelName } = await request.json();
    
    if (!saveState) {
      return NextResponse.json({ error: 'No save state provided' }, { status: 400 });
    }
    
    // Format: YYYY-MM-DD HH:MM D{decision-number} {model-name}
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toISOString().slice(11, 16).replace(':', '-'); // HH-MM (colons not allowed in filenames)
    const safemodelName = (modelName || 'unknown').replace(/[^a-zA-Z0-9-]/g, '-');
    const filename = `save-states/${id}/${dateStr}_${timeStr}_D${decisionNumber}_${safemodelName}.state`;
    
    // Convert base64 save state to buffer
    const stateBuffer = Buffer.from(saveState, 'base64');
    
    // Upload to Vercel Blob
    const blob = await put(filename, stateBuffer, {
      access: 'public',
    });
    
    // console.log(`[api:save-state] Saved state for ${id} at decision ${decisionNumber}: ${blob.url}`);
    
    return NextResponse.json({
      success: true,
      url: blob.url,
      filename,
      decisionNumber,
    });
  } catch (error) {
    // console.error(`[api:save-state] Failed to save state for ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to save state', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
