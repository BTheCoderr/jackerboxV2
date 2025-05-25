import { NextRequest, NextResponse } from 'next/server';
import { Server } from "socket.io";
import { redis } from "@/lib/redis";
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

// Store active fallback sessions
const fallbackSessions: Record<string, { 
  lastPing: number, 
  messages: Array<{ event: string, data: any }> 
}> = {};

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(fallbackSessions).forEach(sid => {
    if (now - fallbackSessions[sid].lastPing > 60000) { // 1 minute timeout
      delete fallbackSessions[sid];
    }
  });
}, 30000); // Run every 30 seconds

// This is a global instance to ensure we reuse the same socket.io server
let io: Server | null = null;
let httpServer: any = null;

/**
 * This route acts as a proxy for the socket.io server.
 * In development, it redirects requests to the actual socket server running on a different port.
 * When the socket server is not available, it provides a fallback implementation.
 */
export async function GET() {
  try {
    if (!io.httpServer) {
      // Initialize socket server if not already running
      const res = new NextResponse();
      // @ts-ignore - we know this exists
      io.attach(res.socket?.server);
    }
    
    return new NextResponse('Socket server running', { status: 200 });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle POST requests (client sending data)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, data } = body;
    
    if (!event) {
      return new NextResponse("Missing event name", { status: 400 });
    }
    
    // Store the event in Redis
    await redis.lpush("events", JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString()
    }));
    
    // Emit the event to all connected clients
    if (io) {
      io.emit(event, data);
      return new NextResponse(`Event ${event} emitted successfully`, { status: 200 });
    } else {
      return new NextResponse("Socket.io server not initialized", { status: 500 });
    }
  } catch (error) {
    console.error("Error processing socket event:", error);
    return new NextResponse(`Failed to process socket event: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
    });
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle other methods
export async function PUT(request: NextRequest) { return GET(); }
export async function DELETE(request: NextRequest) { return GET(); }
export async function PATCH(request: NextRequest) { return GET(); }
export async function HEAD(request: NextRequest) { return GET(); }

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 