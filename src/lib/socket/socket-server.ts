import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import io from "./server-init";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocketServer = async (req: Request) => {
  // If socket.io server is already initialized from server-init, return it
  if (io) {
    return io;
  }

  // In production, we'll use a different approach
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log("Production environment detected, using socket.io client-only mode");
    // In production, we'll just return null and let the client handle reconnection
    return null;
  }

  try {
    // Get the server instance (only in development)
    const server = (globalThis as any).__server;
    if (!server) {
      console.error("HTTP server not available for socket.io");
      console.log("Using fallback mode for socket.io - client will use polling");
      return null;
    }

    console.log("Initializing Socket.io server in development mode...");
    
    // Create a new socket.io server
    const socketIo = new SocketIOServer(server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      // Increase ping intervals to reduce polling frequency
      pingInterval: 60000, // Increase from default 25000ms to 60000ms (60 seconds)
      pingTimeout: 30000,  // Increase from default 20000ms to 30000ms (30 seconds)
      // Prefer WebSocket transport
      transports: ["websocket", "polling"],
      // Allow upgrades from polling to websocket
      allowUpgrades: true,
      upgradeTimeout: 10000,
      // Force clients to use websocket if possible
      connectTimeout: 45000,
    } as any);
    
    // Set up authentication middleware
    socketIo.use(async (socket, next) => {
      try {
        // Get the session from the socket request
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
          return next(new Error("Unauthorized"));
        }
        
        // Attach user data to the socket
        socket.data.user = session.user;
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
      }
    });
    
    // Handle connections
    socketIo.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Log transport type
      const transport = socket.conn.transport.name; // websocket or polling
      console.log(`Socket transport: ${transport}`);
      
      if (transport === "polling") {
        console.log("Client is using polling fallback - this may impact performance");
      }
      
      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
      });
      
      // Handle transport change
      socket.conn.on("upgrade", (transport) => {
        console.log(`Socket transport upgraded to: ${transport.name}`);
      });
    });
    
    console.log("Socket server initialized successfully");
    return socketIo;
  } catch (error) {
    console.error("Error initializing socket server:", error);
    return null;
  }
}; 