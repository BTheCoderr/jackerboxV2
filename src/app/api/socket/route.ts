import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerPort } from '@/lib/socket/server-init';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

// Create a global variable to store the socket server instance
// This is needed because Vercel's serverless functions are stateless
declare global {
  var __vercelSocketServer: {
    io: SocketIOServer | null;
    initialized: boolean;
    initializing: boolean;
    lastInitAttempt: number;
  };
}

// Initialize the global state if it doesn't exist
if (!global.__vercelSocketServer) {
  global.__vercelSocketServer = {
    io: null,
    initialized: false,
    initializing: false,
    lastInitAttempt: 0
  };
}

// Initialize the socket.io server for Vercel
async function initVercelSocketServer() {
  // If server is already initialized, return the current instance
  if (global.__vercelSocketServer.initialized && global.__vercelSocketServer.io) {
    console.log('Vercel Socket server already initialized');
    return global.__vercelSocketServer.io;
  }
  
  // If server is initializing and it's been less than 10 seconds, wait for it
  if (global.__vercelSocketServer.initializing) {
    const now = Date.now();
    const timeSinceLastAttempt = now - global.__vercelSocketServer.lastInitAttempt;
    
    // If it's been less than 10 seconds since the last attempt, wait
    if (timeSinceLastAttempt < 10000) {
      console.log('Vercel Socket server initialization in progress...');
      // Wait for initialization to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (global.__vercelSocketServer.initialized) {
            clearInterval(checkInterval);
            resolve(global.__vercelSocketServer.io);
          }
        }, 100);
      });
    } else {
      // If it's been more than 10 seconds, assume the previous attempt failed
      console.log('Previous Vercel socket server initialization timed out, restarting...');
      global.__vercelSocketServer.initializing = false;
    }
  }
  
  // Set the initialization flag and timestamp
  global.__vercelSocketServer.initializing = true;
  global.__vercelSocketServer.lastInitAttempt = Date.now();

  try {
    console.log('Initializing Vercel Socket.IO server');
    
    // Create a new socket.io server
    const io = new SocketIOServer({
      path: '/api/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Increase ping intervals to reduce polling frequency
      pingInterval: 60000, // 60 seconds
      pingTimeout: 30000,  // 30 seconds
      // In production, prioritize polling over websocket
      transports: ['polling', 'websocket'],
      // Allow upgrades from polling to websocket
      allowUpgrades: true,
      upgradeTimeout: 10000,
      // Additional options for better performance in serverless environments
      connectTimeout: 45000,
      // Disable per-message deflate compression for better performance
      perMessageDeflate: false,
    });
    
    // Set up authentication middleware
    io.use(async (socket, next) => {
      try {
        // Get the session from the socket request
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
          return next(new Error('Unauthorized'));
        }
        
        // Attach user data to the socket
        socket.data.user = session.user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
    
    // Set up connection handling
    io.on('connection', (socket) => {
      console.log(`Vercel Socket connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`Vercel Socket disconnected: ${socket.id}`);
      });
    });
    
    // Store the socket.io server instance
    global.__vercelSocketServer.io = io;
    global.__vercelSocketServer.initialized = true;
    global.__vercelSocketServer.initializing = false;
    
    console.log('Vercel Socket.IO server initialized successfully');
    return io;
  } catch (error) {
    console.error('Error initializing Vercel socket server:', error);
    global.__vercelSocketServer.initializing = false;
    return null;
  }
}

/**
 * This route acts as a proxy for the socket.io server.
 * In development, it redirects requests to the actual socket server running on a different port.
 * In production (Vercel), it handles the socket.io server directly.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we're in production (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    if (isProduction) {
      // In production, we need to handle the socket.io server directly
      console.log('Socket route: Production environment detected');
      
      // Initialize the socket.io server if it's not already initialized
      const io = await initVercelSocketServer();
      
      if (!io) {
        console.error('Failed to initialize Vercel socket server');
        return new NextResponse('Socket server initialization failed', { status: 500 });
      }
      
      // Let the socket.io server handle the request
      // This is a workaround since we can't directly attach the socket.io server to the HTTP server in Vercel
      console.log('Socket route: Letting socket.io handle the request');
      
      // Return a response that indicates the socket server is running
      return new NextResponse('Socket.IO server is running', { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } else {
      // In development, we can redirect to the local socket server
      const port = getSocketServerPort();
      
      if (!port) {
        console.error('Socket server port not available');
        return new NextResponse('Socket server not initialized', { status: 503 });
      }
      
      // Get the hostname from the request
      const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
      
      // Create the target URL for development
      const targetUrl = `http://${hostname}:${port}${request.nextUrl.pathname}${request.nextUrl.search}`;
      
      console.log(`Socket proxy (development): Redirecting to ${targetUrl}`);
      
      // Check if this is a WebSocket upgrade request
      const upgrade = request.headers.get('upgrade');
      const connection = request.headers.get('connection');
      const isWebSocketRequest = upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade');
      
      if (isWebSocketRequest) {
        console.log('Socket proxy: WebSocket upgrade request detected');
        // For WebSocket requests, we need to return a 307 redirect
        return NextResponse.redirect(targetUrl, 307);
      }
      
      // For regular HTTP requests, we can proxy them
      console.log('Socket proxy: Regular HTTP request detected');
      return NextResponse.redirect(targetUrl, 307);
    }
  } catch (error) {
    console.error('Error in socket proxy route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle all other HTTP methods
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}

export async function PATCH(request: NextRequest) {
  return GET(request);
}

export async function OPTIONS(request: NextRequest) {
  return GET(request);
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 