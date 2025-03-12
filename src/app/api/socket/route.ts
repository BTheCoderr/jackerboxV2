import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerPort } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

/**
 * This route acts as a proxy for the socket.io server.
 * It redirects requests to the actual socket server running on a different port.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the socket server port
    const port = getSocketServerPort();
    
    if (!port) {
      console.error('Socket server port not available');
      return new NextResponse('Socket server not initialized', { status: 503 });
    }
    
    // Get the hostname from the request
    const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
    
    // Create the target URL
    const targetUrl = `http://${hostname}:${port}${request.nextUrl.pathname}${request.nextUrl.search}`;
    
    console.log(`Socket proxy: Redirecting to ${targetUrl}`);
    
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade');
    const connection = request.headers.get('connection');
    
    if (upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade')) {
      console.log('Socket proxy: WebSocket upgrade request detected');
      // For WebSocket requests, we need to return a 307 redirect
      // The client will follow this redirect and establish a WebSocket connection directly
      return NextResponse.redirect(targetUrl, 307);
    }
    
    // For regular HTTP requests, we can proxy them
    console.log('Socket proxy: Regular HTTP request detected');
    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('Error in socket proxy route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle all other HTTP methods
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}

export async function PATCH(request: NextRequest) {
  return GET(request);
}

export async function OPTIONS(request: NextRequest) {
  return GET(request);
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 