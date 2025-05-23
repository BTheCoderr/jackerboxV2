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
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRestart = searchParams.get('restart') === 'true';
  
  // Restart the server if requested
  if (forceRestart && io) {
    console.log('Force restarting socket.io server');
    io.close();
    io = null;
    if (httpServer) {
      httpServer.close();
      httpServer = null;
    }
  }

  // If socket.io server is already initialized, return early
  if (io) {
    return new NextResponse("Socket.io server is already running", {
      status: 200,
    });
  }

  try {
    // Get the Socket.io adapter for Redis
    const createAdapter = (await import("@socket.io/redis-adapter")).createAdapter;
    
    // Create Redis pub/sub clients
    const pubClient = redis;
    // Create a new Redis client for sub client with the same configuration as the main client
    const subClient = new Redis({
      url: process.env.KV_REST_API_URL || process.env.REDIS_URL || '',
      token: process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || '',
    });
    
    // Create a new Socket.io server
    io = new Server({
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    
    // Use Redis adapter for multi-instance support
    io.adapter(createAdapter(pubClient, subClient));
    
    // Set up connection event
    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);
      
      // Store the connection in Redis for tracking
      redis.set(`socket:${socket.id}`, JSON.stringify({
        id: socket.id,
        connected: true,
        timestamp: new Date().toISOString()
      }), {
        ex: 3600 // Expire after 1 hour
      });
      
      // Send an immediate welcome message
      socket.emit('welcome', { 
        message: 'Connected to Jackerbox socket server',
        socketId: socket.id,
        serverTime: new Date().toISOString()
      });
      
      // Handle events
      socket.on("message", async (data) => {
        console.log("Message received:", data);
        
        // Store message in Redis
        await redis.lpush("messages", JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          socketId: socket.id
        }));
        
        // Broadcast to all clients
        if (io) {
          io.emit("message", data);
        }
      });
      
      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        redis.del(`socket:${socket.id}`);
      });
    });
    
    // Create an HTTP server
    const http = await import("http");
    httpServer = http.createServer();
    
    // Attach Socket.io to the HTTP server
    io.attach(httpServer);
    
    // Start listening on a port
    const port = parseInt(process.env.SOCKET_PORT || '3002');
    httpServer.listen(port, () => {
      console.log(`Socket.io server running on port ${port}`);
    });
    
    return new NextResponse("Socket.io server started", {
      status: 200,
    });
  } catch (error) {
    console.error("Error starting Socket.io server:", error);
    return new NextResponse(`Failed to start Socket.io server: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
    });
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
export async function PUT(request: NextRequest) { return GET(request); }
export async function DELETE(request: NextRequest) { return GET(request); }
export async function PATCH(request: NextRequest) { return GET(request); }
export async function HEAD(request: NextRequest) { return GET(request); }

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 