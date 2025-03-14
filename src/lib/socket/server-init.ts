import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AddressInfo } from 'net';
import { configureForServerless } from './vercel-adapter';

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
        console.log(`Socket.io server URL: http://localhost:${port}/socket.io/`);
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

// Initialize the socket server
export async function initServer() {
  // If server is already initialized, return the current instance
  if (global.__socketServer.initialized && global.__socketServer.io) {
    console.log('Socket server already initialized');
    return global.__socketServer.io;
  }
  
  // If server is currently initializing, wait for it to complete
  if (global.__socketServer.initializing) {
    console.log('Socket server initialization in progress...');
    
    // Wait for initialization to complete (up to 5 seconds)
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      if (global.__socketServer.initialized && global.__socketServer.io) {
        return global.__socketServer.io;
      }
      
      if (global.__socketServer.error) {
        throw global.__socketServer.error;
      }
    }
    
    throw new Error('Socket server initialization timed out');
  }
  
  // Prevent multiple initialization attempts in a short period
  const now = Date.now();
  if (now - global.__socketServer.lastInitAttempt < 5000) {
    console.log('Socket server initialization attempted too frequently, waiting...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  
  global.__socketServer.lastInitAttempt = now;
  global.__socketServer.initializing = true;
  global.__socketServer.error = null;
  
  try {
    console.log('Initializing socket.io server for development environment');
    
    // Create a new HTTP server
    const httpServer = createServer((req, res) => {
      // Basic request handler for the HTTP server
      // This allows us to respond to health checks and other requests
      console.log(`Socket server received HTTP request: ${req.method} ${req.url}`);
      
      // Add CORS headers to all responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      
      // Handle socket.io requests
      if (req.url?.startsWith('/socket.io/')) {
        // Let socket.io handle these
        console.log('Received Socket.IO request, letting Socket.IO handle it');
        return;
      }
      
      // Handle health check
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          socketServer: 'running',
          port: global.__socketServer.port
        }));
        return;
      }
      
      // Default response for other requests
      res.writeHead(404);
      res.end('Not found');
    });
    
    // Create a new socket.io server
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Allow all origins for testing
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      // Allow both polling and websocket transports
      transports: ['polling', 'websocket'],
      // Explicitly set the path
      path: '/socket.io/',
      // Set connection timeout
      connectTimeout: 30000,
      // Set ping interval
      pingInterval: 25000,
      // Set ping timeout
      pingTimeout: 20000,
    });
    
    // Store the server instances
    global.__socketServer.io = io;
    global.__socketServer.httpServer = httpServer;
    
    // Configure for serverless environment if needed
    if (process.env.VERCEL === '1') {
      try {
        await configureForServerless(io);
      } catch (error) {
        console.error('Error configuring for serverless:', error);
        console.log('Continuing with default configuration');
      }
    }
    
    // Set up authentication middleware
    io.use(async (socket, next) => {
      try {
        console.log('Socket authentication attempt:', socket.id);
        
        // Get the session from the socket request
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
          console.log('Socket authentication failed: No session or user');
          
          // In development, allow unauthenticated connections for testing
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Allowing unauthenticated connection for testing');
            socket.data.user = { id: 'test-user', name: 'Test User' };
            return next();
          }
          
          return next(new Error('Unauthorized'));
        }
        
        // Attach user data to the socket
        socket.data.user = session.user;
        console.log('Socket authenticated for user:', session.user.id);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        
        // In development, allow connections even if authentication fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Allowing connection despite authentication error');
          socket.data.user = { id: 'test-user', name: 'Test User' };
          return next();
        }
        
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
      
      // Log socket details
      console.log('Socket details:', {
        id: socket.id,
        transport: socket.conn.transport.name,
        handshake: {
          address: socket.handshake.address,
          headers: socket.handshake.headers,
          query: socket.handshake.query,
          auth: socket.handshake.auth,
        }
      });
      
      // Handle socket events
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
      
      // Handle test messages
      socket.on('test_message', (data) => {
        console.log(`Received test message from ${socket.id}:`, data);
        // Echo the message back to the client
        socket.emit('test_response', {
          message: `Server received: ${data.text}`,
          timestamp: new Date().toISOString()
        });
      });
      
      // Send a welcome message
      socket.emit('welcome', { message: 'Connected to socket server' });
    });
    
    // Mark initialization as complete
    global.__socketServer.initialized = true;
    global.__socketServer.initializing = false;
    
    console.log('Socket server initialized successfully');
    console.log(`Socket server running at http://localhost:${global.__socketServer.port}/socket.io/`);
    
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
// in all environments
initServer().catch(error => {
  console.error('Failed to initialize socket server:', error);
  console.log('Socket server initialization failed, will use fallback mode');
});

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