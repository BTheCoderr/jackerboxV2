import { NextRequest, NextResponse } from 'next/server';
import { createSSEConnection, subscribe, unsubscribe, getStats, toggleDebugMode, isSSEClientOwnedBy } from '@/lib/sse/sse-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60; // Maximum allowed duration for Vercel Hobby plan (60 seconds)
export const fetchCache = 'force-no-store';

/**
 * Handle SSE connection requests
 */
export async function GET() {
  const isDev = process.env.NODE_ENV === 'development';
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Set up SSE headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Allow CORS in development
  if (isDev) {
    responseHeaders.set('Access-Control-Allow-Origin', '*');
  }

  try {
    const userId = session.user.id;

    // Create the SSE stream
    const stream = await Promise.resolve().then(() => createSSEConnection(userId));

    // Return the stream response - don't try to attach any abort listeners as they cause "stream locked" errors
    return new Response(stream, { headers: responseHeaders });
  } catch (error) {
    console.error('Error in SSE GET route:', error);
    
    // Return a more detailed error response
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to establish SSE connection',
        code: 'CONNECTION_ERROR',
        timestamp: Date.now(),
        details: 'Unable to create event stream'
      })}\n\n`,
      { headers: responseHeaders, status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { clientId, action, topic, enabled } = body;

    // Handle debug mode toggle
    if (action === 'debug') {
      if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (typeof clientId !== 'string' || !isSSEClientOwnedBy(clientId, user.id)) {
      return NextResponse.json({ error: 'SSE connection not found or not owned by this user' }, { status: 403 });
    }

    // Topic is required for subscribe/unsubscribe
    if ((action === 'subscribe' || action === 'unsubscribe') && !topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (typeof topic !== 'string' && (action === 'subscribe' || action === 'unsubscribe')) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }
    if ((action === 'subscribe' || action === 'unsubscribe') &&
        !user.isAdmin && topic !== `user:${user.id}` && !topic.startsWith('public:')) {
      return NextResponse.json({ error: 'Cannot subscribe to a restricted topic' }, { status: 403 });
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
        if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      details: 'Request failed'
    }, { status: 500 });
  }
} 