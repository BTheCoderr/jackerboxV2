import { NextResponse } from 'next/server';
import { getSocketServerStatus } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the socket server status
    const status = getSocketServerStatus();
    
    // Return the status
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Return the error
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 