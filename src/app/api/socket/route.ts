import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerPort } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

/**
 * This route acts as a proxy for the socket.io server.
 * In development, it redirects requests to the actual socket server running on a different port.
 * In production (Vercel), it returns responses that allow the socket.io client to function with polling.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we're in production (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    if (isProduction) {
      // In production, we need to handle socket.io requests differently
      console.log('Socket route: Production environment detected');
      
      // Get the URL parameters
      const searchParams = request.nextUrl.searchParams;
      const sid = searchParams.get('sid');
      const transport = searchParams.get('transport');
      const eio = searchParams.get('EIO');
      
      // Log the request details
      console.log(`Socket request: sid=${sid}, transport=${transport}, EIO=${eio}`);
      
      // Check if this is a WebSocket upgrade request
      const upgrade = request.headers.get('upgrade');
      const connection = request.headers.get('connection');
      const isWebSocketRequest = upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade');
      
      if (isWebSocketRequest) {
        // For WebSocket requests in production, return a response that forces fallback to polling
        console.log('Socket proxy (production): WebSocket request detected, forcing fallback to polling');
        return new NextResponse('WebSockets not supported in this environment', { 
          status: 426, // Upgrade Required
          headers: {
            'Content-Type': 'text/plain',
            'Connection': 'close'
          }
        });
      } else if (transport === 'polling') {
        // For polling requests, return a valid socket.io response
        console.log('Socket proxy (production): Polling request detected');
        
        // If this is an initial connection request (no sid)
        if (!sid) {
          // Return a socket.io handshake response
          // This is a simplified version that tells the client to use polling
          const handshakeResponse = {
            sid: `server-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            upgrades: [], // No upgrades available, forcing polling
            pingInterval: 25000,
            pingTimeout: 20000,
            maxPayload: 1000000
          };
          
          // Format the response according to socket.io protocol
          // The "0" prefix indicates this is an "open" packet
          const response = `0${JSON.stringify(handshakeResponse)}`;
          
          return new NextResponse(response, { 
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          });
        } else {
          // For subsequent polling requests, return an empty response
          // The "40" prefix indicates this is a "message" packet with no data
          return new NextResponse('40', { 
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          });
        }
      } else {
        // For other requests, return a generic response
        return new NextResponse('Invalid socket.io request', { 
          status: 400,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      }
    } else {
      // In development, we can redirect to the local socket server
      const port = getSocketServerPort();
      
      if (!port) {
        console.error('Socket server port not available');
        return new NextResponse('Socket server not initialized', { status: 503 });
      }
      
      // Get the hostname from the request
      const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
      
      // Create the target URL for development
      const targetUrl = `http://${hostname}:${port}${request.nextUrl.pathname}${request.nextUrl.search}`;
      
      console.log(`Socket proxy (development): Redirecting to ${targetUrl}`);
      
      // Check if this is a WebSocket upgrade request
      const upgrade = request.headers.get('upgrade');
      const connection = request.headers.get('connection');
      const isWebSocketRequest = upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade');
      
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
  try {
    // Check if we're in production (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    if (isProduction) {
      // In production, handle POST requests for socket.io polling
      console.log('Socket route POST: Production environment detected');
      
      // Get the URL parameters
      const searchParams = request.nextUrl.searchParams;
      const sid = searchParams.get('sid');
      const transport = searchParams.get('transport');
      
      if (transport === 'polling' && sid) {
        // For polling POST requests, acknowledge the message
        // The "40" prefix indicates this is a "message" packet with no data
        return new NextResponse('40', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      } else {
        return new NextResponse('Invalid socket.io request', { status: 400 });
      }
    } else {
      // In development, proxy to the local socket server
      return GET(request);
    }
  } catch (error) {
    console.error('Error in socket proxy route (POST):', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
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