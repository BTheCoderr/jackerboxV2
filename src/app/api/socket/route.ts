import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerPort } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

/**
 * This route acts as a proxy for the socket.io server.
 * It redirects requests to the actual socket server running on a different port.
 * In production (Vercel), it will handle polling directly.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we're in production (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Get the socket server port
    const port = getSocketServerPort();
    
    if (!port && !isProduction) {
      console.error('Socket server port not available');
      return new NextResponse('Socket server not initialized', { status: 503 });
    }
    
    // Get the hostname from the request
    const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
    
    // Create the target URL for development
    const targetUrl = `http://${hostname}:${port}${request.nextUrl.pathname}${request.nextUrl.search}`;
    
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade');
    const connection = request.headers.get('connection');
    const isWebSocketRequest = upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade');
    
    // In production, we need special handling
    if (isProduction) {
      if (isWebSocketRequest) {
        // For WebSocket requests in production, we need to handle them differently
        // Since Vercel doesn't support WebSockets directly, we'll return a response
        // that will cause the client to fall back to polling
        console.log('Socket proxy (production): WebSocket request detected, forcing fallback to polling');
        return new NextResponse('WebSockets not supported in this environment', { 
          status: 426, // Upgrade Required
          headers: {
            'Content-Type': 'text/plain',
            'Connection': 'close'
          }
        });
      } else {
        // For polling requests in production, we'll handle them through the API route
        console.log('Socket proxy (production): Polling request detected');
        
        // Here we would implement the actual socket.io polling logic
        // For now, we'll just return a response that indicates polling is supported
        return new NextResponse('Socket.IO polling endpoint', { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      }
    } else {
      // In development, we can redirect to the local socket server
      console.log(`Socket proxy (development): Redirecting to ${targetUrl}`);
      
      if (isWebSocketRequest) {
        console.log('Socket proxy: WebSocket upgrade request detected');
        // For WebSocket requests, we need to return a 307 redirect
        return NextResponse.redirect(targetUrl, 307);
      }
      
      // For regular HTTP requests, we can proxy them
      console.log('Socket proxy: Regular HTTP request detected');
      return NextResponse.redirect(targetUrl, 307);
    }
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