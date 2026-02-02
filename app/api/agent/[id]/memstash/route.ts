import { NextResponse } from 'next/server';
import { getMemStash, clearMemStash, clearDecisionLog } from '@/lib/memstash';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const content = await getMemStash(id);
    return NextResponse.json({ content });
  } catch (error) {
    // console.error(`[api:memstash] Failed to get memStash for ${id}:`, error);
    return NextResponse.json({ content: '', error: 'Failed to fetch memStash' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await clearMemStash(id);
    await clearDecisionLog(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error(`[api:memstash] Failed to clear memStash for ${id}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to clear memStash' }, { status: 500 });
  }
}
