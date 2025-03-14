import { NextResponse } from 'next/server';
import { shutdownSocketServer, initServer, getSocketServerStatus } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Restarting socket server...');
    
    // First, shut down the existing server
    shutdownSocketServer();
    console.log('Socket server shut down');
    
    // Wait a moment to ensure clean shutdown
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Then initialize a new server
    console.log('Initializing new socket server...');
    const io = await initServer();
    const status = getSocketServerStatus();
    
    return NextResponse.json({
      success: !!io,
      message: io ? 'Socket server restarted successfully' : 'Socket server restart failed',
      status
    });
  } catch (error: any) {
    console.error('Error restarting socket server:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to restart socket server',
        status: getSocketServerStatus()
      },
      { status: 500 }
    );
  }
} 