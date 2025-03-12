import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AddressInfo } from 'net';

// This is a workaround to make the HTTP server available to socket.io
// in the Next.js App Router environment

// Create global variables to store the server state
declare global {
  var __socketServer: {
    io: SocketIOServer | null;
    httpServer: any;
    port: number | null;
    initialized: boolean;
    initializing: boolean;
    error: Error | null;
    lastInitAttempt: number;
  };
}

// Initialize the global state if it doesn't exist
if (!global.__socketServer) {
  global.__socketServer = {
    io: null,
    httpServer: null,
    port: null,
    initialized: false,
    initializing: false,
    error: null,
    lastInitAttempt: 0
  };
}

// Check if a port is available
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const testServer = createServer();
    
    testServer.once('error', (err: any) => {
      testServer.close();
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use`);
        resolve(false);
      } else {
        console.error(`Error checking port ${port}:`, err);
        resolve(false);
      }
    });
    
    testServer.once('listening', () => {
      const address = testServer.address() as AddressInfo;
      console.log(`Port ${address.port} is available`);
      testServer.close();
      resolve(true);
    });
    
    testServer.listen(port);
  });
};

// Find an available port starting from the given port
const findAvailablePort = async (startPort: number, maxAttempts = 5): Promise<number | null> => {
  const ports = [startPort, 3002, 3003, 3004, 3005]; // Try these specific ports
  
  for (const port of ports) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  
  return null;
};

// Shutdown the socket server
export function shutdownSocketServer() {
  if (global.__socketServer.io) {
    console.log('Shutting down socket server...');
    global.__socketServer.io.close();
    global.__socketServer.io = null;
  }
  
  if (global.__socketServer.httpServer) {
    console.log('Shutting down HTTP server...');
    global.__socketServer.httpServer.close();
    global.__socketServer.httpServer = null;
  }
  
  global.__socketServer.initialized = false;
  global.__socketServer.initializing = false;
  global.__socketServer.port = null;
  global.__socketServer.error = null;
  
  console.log('Socket server shutdown complete');
}

// Try to listen on a port
const tryListen = (httpServer: any, port: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      httpServer.listen(port, () => {
        console.log(`Socket.io HTTP server listening on port ${port}`);
        global.__socketServer.port = port;
        resolve();
      });
      
      httpServer.once('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Socket functionality will be limited to polling.`);
        } else {
          console.error('Socket server error:', error);
        }
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Initialize the socket.io server
export async function initServer() {
  // If server is already initialized, return the current instance
  if (global.__socketServer.initialized && global.__socketServer.io) {
    console.log('Socket server already initialized');
    return global.__socketServer.io;
  }
  
  // If server is initializing and it's been less than 10 seconds, wait for it
  if (global.__socketServer.initializing) {
    const now = Date.now();
    const timeSinceLastAttempt = now - global.__socketServer.lastInitAttempt;
    
    // If it's been less than 10 seconds since the last attempt, wait
    if (timeSinceLastAttempt < 10000) {
      console.log('Socket server initialization in progress...');
      // Wait for initialization to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (global.__socketServer.initialized || global.__socketServer.error) {
            clearInterval(checkInterval);
            resolve(global.__socketServer.io);
          }
        }, 100);
      });
    } else {
      // If it's been more than 10 seconds, assume the previous attempt failed
      console.log('Previous socket server initialization timed out, restarting...');
      shutdownSocketServer();
    }
  }
  
  // Set the initialization flag and timestamp
  global.__socketServer.initializing = true;
  global.__socketServer.lastInitAttempt = Date.now();

  try {
    console.log(`Initializing socket.io server for ${process.env.NODE_ENV} environment`);
    
    // Create a new HTTP server
    const httpServer = createServer();
    global.__socketServer.httpServer = httpServer;
    
    // Create a new socket.io server
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.NEXTAUTH_URL || '', 'https://jackerbox.vercel.app'] 
          : '*',
        methods: ['GET', 'POST'],
        credentials: true
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
    
    global.__socketServer.io = io;
    
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
    const basePort = 3001;
    
    // Find an available port
    const availablePort = await findAvailablePort(basePort);
    
    if (!availablePort) {
      throw new Error('Could not find an available port for socket server');
    }
    
    // Start the server on the available port
    try {
      await tryListen(httpServer, availablePort);
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        // If the port is in use, try to find another available port
        console.log(`Port ${availablePort} is in use, trying to find another port...`);
        
        // Force shutdown any existing server
        shutdownSocketServer();
        
        // Try to find another available port
        const newPort = await findAvailablePort(3002);
        
        if (!newPort) {
          throw new Error('Could not find an available port for socket server after retry');
        }
        
        // Try to listen on the new port
        await tryListen(httpServer, newPort);
      } else {
        throw error;
      }
    }
    
    // Set up error handling for the server
    httpServer.on('error', (error: any) => {
      console.error('Socket server error:', error);
      global.__socketServer.error = error;
      
      if (error.code === 'EADDRINUSE') {
        console.log('Port conflicts detected, socket functionality will be limited to polling');
      }
    });
    
    // Set up connection handling
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
    
    // Mark initialization as complete
    global.__socketServer.initialized = true;
    global.__socketServer.initializing = false;
    
    return io;
  } catch (error: any) {
    console.error('Error initializing socket server:', error);
    global.__socketServer.error = error;
    global.__socketServer.initializing = false;
    
    // Clean up any resources that might have been created
    if (global.__socketServer.io) {
      global.__socketServer.io.close();
      global.__socketServer.io = null;
    }
    
    if (global.__socketServer.httpServer) {
      global.__socketServer.httpServer.close();
      global.__socketServer.httpServer = null;
    }
    
    console.log('HTTP server not available for socket.io');
    console.log('Using fallback mode for socket.io - client will use polling');
    
    return null;
  }
}

// Initialize the server when this module is imported
// but only in development mode
if (process.env.NODE_ENV !== 'production') {
  initServer().catch(error => {
    console.error('Failed to initialize socket server:', error);
    console.log('Socket server initialization failed, will use fallback mode');
  });
}

// Export the socket.io server instance getter
export function getSocketServer() {
  return global.__socketServer.io;
}

// Export the socket server port
export function getSocketServerPort() {
  return global.__socketServer.port;
}

// Export the socket server status
export function getSocketServerStatus() {
  return {
    initialized: global.__socketServer.initialized,
    initializing: global.__socketServer.initializing,
    port: global.__socketServer.port,
    error: global.__socketServer.error ? global.__socketServer.error.message : null
  };
} 