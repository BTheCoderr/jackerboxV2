import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// This is a workaround to make the HTTP server available to socket.io
// in the Next.js App Router environment

// Create a global variable to store the HTTP server
declare global {
  var __server: any;
}

// Global socket.io server instance
let io: SocketIOServer | null = null;
let httpServer: any = null;

// Initialize the socket.io server
export function initServer() {
  // If server is already initialized, return it
  if (io) {
    return io;
  }

  try {
    console.log('Initializing socket.io server for API route');
    
    // Create a new HTTP server
    httpServer = createServer();
    
    // Create a new socket.io server
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      // Increase ping intervals to reduce polling frequency
      pingInterval: 60000, // 60 seconds
      pingTimeout: 30000,  // 30 seconds
      // Prefer WebSocket transport
      transports: ['websocket', 'polling'],
      // Allow upgrades from polling to websocket
      allowUpgrades: true,
      upgradeTimeout: 10000,
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
    
    // Start the server on a different port to avoid conflicts with Next.js
    const port = 3001;
    
    // Try to listen on the primary port, with fallback ports if needed
    const tryListen = (portToTry: number, maxRetries = 3, currentRetry = 0) => {
      try {
        httpServer.listen(portToTry, () => {
          console.log(`Socket.io HTTP server listening on port ${portToTry}`);
        });
      } catch (error: any) {
        if (error.code === 'EADDRINUSE' && currentRetry < maxRetries) {
          console.log(`Port ${portToTry} is already in use, trying port ${portToTry + 1}`);
          tryListen(portToTry + 1, maxRetries, currentRetry + 1);
        } else {
          console.error('Socket server error:', error);
          console.log('Port conflicts detected, socket functionality will be limited');
        }
      }
    };
    
    // Start with the initial port
    tryListen(port);
    
    return io;
  } catch (error) {
    console.error('Error initializing socket server:', error);
    return null;
  }
}

// Initialize the server when this module is imported
// but only in development mode
if (process.env.NODE_ENV !== 'production') {
  initServer();
}

// Export the socket.io server instance
export default io; 