import { NextRequest, NextResponse } from 'next/server';
import { toggleDebugMode, getDebugMode } from '@/lib/sse/sse-manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Get current debug mode status
 */
export async function GET(req: NextRequest) {
  try {
    const debugMode = getDebugMode();
    return NextResponse.json({ debugMode });
  } catch (error) {
    console.error('Error getting SSE debug mode:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Toggle debug mode
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Enabled parameter must be a boolean' }, { status: 400 });
    }

    const result = toggleDebugMode(enabled);
    return NextResponse.json({ success: true, debugMode: result });
  } catch (error) {
    console.error('Error toggling SSE debug mode:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 