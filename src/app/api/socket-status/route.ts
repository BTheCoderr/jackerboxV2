import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerStatus, getSocketServerPort } from '@/lib/socket/server-init';

// This route returns the status of the socket server
export async function GET(request: NextRequest) {
  try {
    // Get the socket server status
    const status = getSocketServerStatus();
    const port = getSocketServerPort();
    
    // Get the hostname from the request
    const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
    
    // Add additional information to the status
    const enhancedStatus = {
      ...status,
      port,
      socketServerUrl: port ? `http://${hostname}:${port}` : null,
      proxyUrl: `http://${hostname}:${request.headers.get('host')?.split(':')[1] || '3000'}/api/socket`,
      timestamp: new Date().toISOString(),
    };
    
    // Return the status as JSON
    return NextResponse.json(enhancedStatus);
  } catch (error) {
    console.error('Error getting socket server status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get socket server status',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
}

// Disable response caching
export const dynamic = 'force-dynamic'; 