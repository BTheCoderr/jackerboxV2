import { NextResponse } from "next/server";
import { initSocketServer } from "@/lib/socket/socket-server";
import { Server } from "socket.io";

// Store the socket.io server instance globally
let io: Server | null = null;

// Initialize the HTTP server reference for socket.io
// This is needed because socket.io requires access to the HTTP server
export async function GET(req: Request) {
  try {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      // Only initialize socket server in development
      if (!io) {
        console.log("Initializing socket.io server for API route");
        io = await initSocketServer(req);
        
        if (!io) {
          console.log("Socket server initialization failed, will use fallback mode");
        } else {
          console.log("Socket server initialized successfully");
        }
      }
    }

    // Return a simple response for health checks
    return new NextResponse(
      JSON.stringify({
        status: "ok",
        mode: io ? "websocket" : "fallback",
        environment: isProduction ? "production" : "development",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Socket.io error:", error);
    return new NextResponse(
      JSON.stringify({
        status: "error",
        message: "Error initializing Socket.io server",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Make sure this route is always dynamic
export const dynamic = "force-dynamic";

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 