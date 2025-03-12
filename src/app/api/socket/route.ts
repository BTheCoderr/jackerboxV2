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
      return new NextResponse('Socket server not initialized', { status: 503 });
    }
    
    // Get the hostname from the request
    const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
    
    // Construct the socket server URL
    const socketServerUrl = `http://${hostname}:${port}/api/socket`;
    
    // Create a response with a redirect
    return NextResponse.redirect(socketServerUrl, { status: 307 });
  } catch (error: any) {
    console.error('Error in socket proxy route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 