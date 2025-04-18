import { NextRequest, NextResponse } from 'next/server';
import { createSSEConnection, subscribe, unsubscribe, getStats, toggleDebugMode } from '@/lib/sse/sse-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 300; // 5 minutes

/**
 * Handle SSE connection requests
 */
export async function GET(req: NextRequest) {
  // Create headers for SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  try {
    // Get user session if available
    let userId: string | undefined = undefined;
    try {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
      // Continue without user ID
    }

    // Create the SSE stream
    const stream = await Promise.resolve().then(() => createSSEConnection(userId));

    // Return the stream response - don't try to attach any abort listeners as they cause "stream locked" errors
    return new Response(stream, { headers });
  } catch (error) {
    console.error('Error in SSE GET route:', error);
    
    // Return a more detailed error response
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to establish SSE connection',
        code: 'CONNECTION_ERROR',
        timestamp: Date.now(),
        details: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`,
      { headers, status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Handle subscription requests
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { clientId, action, topic, enabled } = body;

    // Handle debug mode toggle
    if (action === 'debug') {
      if (typeof enabled === 'boolean') {
        const result = toggleDebugMode(enabled);
        return NextResponse.json({ success: true, debugMode: result });
      }
      return NextResponse.json({ error: 'Invalid debug mode parameter' }, { status: 400 });
    }

    // All other actions require a client ID
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Topic is required for subscribe/unsubscribe
    if ((action === 'subscribe' || action === 'unsubscribe') && !topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'subscribe':
        result = subscribe(clientId, topic);
        return NextResponse.json({ success: result, action, topic });
      
      case 'unsubscribe':
        result = unsubscribe(clientId, topic);
        return NextResponse.json({ success: result, action, topic });
      
      case 'stats':
        result = getStats();
        return NextResponse.json(result);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in SSE API route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 