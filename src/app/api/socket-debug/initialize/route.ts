import { NextResponse } from 'next/server';
import { initServer, getSocketServerStatus } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Attempting to initialize socket server...');
    const io = await initServer();
    const status = getSocketServerStatus();
    
    return NextResponse.json({
      success: !!io,
      message: io ? 'Socket server initialized successfully' : 'Socket server initialization failed',
      status
    });
  } catch (error: any) {
    console.error('Error initializing socket server:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to initialize socket server',
        status: getSocketServerStatus()
      },
      { status: 500 }
    );
  }
} 