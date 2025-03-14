import { NextResponse } from 'next/server';
import { getSocketServerStatus } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getSocketServerStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error getting socket server status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get socket server status' },
      { status: 500 }
    );
  }
} 