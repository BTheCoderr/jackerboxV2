// Socket.io server for real-time communication
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Socket server configuration
const PORT = parseInt(process.env.SOCKET_SERVER_PORT || '3002', 10);
const CLIENT_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log(`Starting socket server with configuration:`);
console.log(`- Port: ${PORT}`);
console.log(`- Client URL: ${CLIENT_URL}`);

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }
  
  // Return 404 for all other routes
  res.writeHead(404);
  res.end('Not found');
});

// Create Socket.IO server with optimized configuration
const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  // Increase timeouts for better reliability
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 30000,
  // Prefer WebSocket transport
  transports: ['websocket', 'polling']
});

// Record active connections for monitoring
const activeConnections = new Map();

// Connection event
io.on('connection', (socket) => {
  const socketId = socket.id;
  const transportType = socket.conn.transport.name;
  const clientIp = socket.handshake.address;
  const queryParams = socket.handshake.query;
  
  // Store connection info
  activeConnections.set(socketId, {
    id: socketId,
    transport: transportType,
    ip: clientIp,
    connectedAt: new Date(),
    rooms: []
  });
  
  console.log(`Socket connected: ${socketId} (${transportType}) from ${clientIp}`);
  
  // Join a chat room
  socket.on('join_chat', (chatId) => {
    if (typeof chatId !== 'string') {
      console.warn(`Invalid chatId from socket ${socketId}: ${chatId}`);
      return;
    }
    
    console.log(`Socket ${socketId} joined chat: ${chatId}`);
    socket.join(chatId);
    
    // Update connection info
    const connInfo = activeConnections.get(socketId);
    if (connInfo) {
      if (!connInfo.rooms.includes(chatId)) {
        connInfo.rooms.push(chatId);
      }
      activeConnections.set(socketId, connInfo);
    }
    
    // Send confirmation to the client
    socket.emit('chat_joined', { chatId, timestamp: new Date().toISOString() });
  });
  
  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    if (typeof chatId !== 'string') {
      console.warn(`Invalid chatId from socket ${socketId}: ${chatId}`);
      return;
    }
    
    console.log(`Socket ${socketId} left chat: ${chatId}`);
    socket.leave(chatId);
    
    // Update connection info
    const connInfo = activeConnections.get(socketId);
    if (connInfo) {
      connInfo.rooms = connInfo.rooms.filter(room => room !== chatId);
      activeConnections.set(socketId, connInfo);
    }
    
    // Send confirmation to the client
    socket.emit('chat_left', { chatId, timestamp: new Date().toISOString() });
  });
  
  // Send a message
  socket.on('send_message', (data) => {
    if (!data || typeof data.chatId !== 'string' || !data.message) {
      console.warn(`Invalid message data from socket ${socketId}:`, data);
      return;
    }
    
    console.log(`Message sent in chat ${data.chatId} by socket ${socketId}`);
    
    // Broadcast to all clients in the room
    io.to(data.chatId).emit('receive_message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // User typing indicator
  socket.on('typing', (data) => {
    if (!data || typeof data.chatId !== 'string') {
      console.warn(`Invalid typing data from socket ${socketId}:`, data);
      return;
    }
    
    console.log(`User typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit('user_typing', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle ping (for connection testing)
  socket.on('ping', (callback) => {
    if (typeof callback === 'function') {
      callback({
        pong: true,
        timestamp: new Date().toISOString(),
        socketId
      });
    } else {
      socket.emit('pong', {
        timestamp: new Date().toISOString(),
        socketId
      });
    }
  });
  
  // Handle test messages
  socket.on('test', (data) => {
    console.log(`Test message from ${socketId}:`, data);
    socket.emit('test_response', {
      received: data,
      echo: `Server received: ${data.message || 'No message'}`,
      timestamp: new Date().toISOString()
    });
  });
  
  // Transport change (polling -> websocket)
  socket.conn.on('upgrade', (transport) => {
    console.log(`Socket ${socketId} transport upgraded from ${activeConnections.get(socketId)?.transport} to ${transport.name}`);
    
    // Update connection info
    const connInfo = activeConnections.get(socketId);
    if (connInfo) {
      connInfo.transport = transport.name;
      activeConnections.set(socketId, connInfo);
    }
  });
  
  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socketId}:`, error);
    socket.emit('server_error', { message: 'Server encountered an error', timestamp: new Date().toISOString() });
  });
  
  // Disconnect event
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socketId}, reason: ${reason}`);
    activeConnections.delete(socketId);
  });
  
  // Send welcome message with server info
  socket.emit('welcome', { 
    socketId, 
    transport: transportType,
    server: 'Jackerbox Socket Server',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toISOString()
  });
});

// Update environment file with port information
function updateEnvFile() {
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    // Try to read existing .env.local file
    try {
      if (fs.existsSync(envLocalPath)) {
        envContent = fs.readFileSync(envLocalPath, 'utf8');
      }
    } catch (err) {
      console.warn('Could not read existing .env.local file, creating new file');
    }
    
    // Check if the NEXT_PUBLIC_SOCKET_SERVER_PORT is already set
    const regex = /NEXT_PUBLIC_SOCKET_SERVER_PORT=(\d+)/;
    const hasPort = regex.test(envContent);
    
    if (hasPort) {
      // Update the port value
      envContent = envContent.replace(regex, `NEXT_PUBLIC_SOCKET_SERVER_PORT=${PORT}`);
    } else {
      // Add the port configuration
      const timestamp = new Date().toISOString();
      
      if (envContent === '') {
        // Create new file with header
        envContent = `# Auto-generated on socket setup\n# Generated: ${timestamp}\n\n# Socket.IO Client Configuration\nNEXT_PUBLIC_SOCKET_SERVER_PORT=${PORT}\n\n# Override any other environment variables as needed\n`;
      } else if (!envContent.includes('NEXT_PUBLIC_SOCKET_SERVER_PORT')) {
        // Append to existing file
        envContent += `\n# Socket.IO Client Configuration (added: ${timestamp})\nNEXT_PUBLIC_SOCKET_SERVER_PORT=${PORT}\n`;
      }
    }
    
    // Write the updated content
    fs.writeFileSync(envLocalPath, envContent);
    console.log(`Updated ${envLocalPath} with socket port ${PORT}`);
  } catch (err) {
    console.error('Error updating .env.local file:', err);
    console.log('You may need to manually set NEXT_PUBLIC_SOCKET_SERVER_PORT in your .env.local file');
  }
}

// Start HTTP server
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/socket.io/`);
  console.log(`HTTP endpoint: http://localhost:${PORT}/socket.io/`);
  
  // Update .env.local with socket port
  updateEnvFile();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down socket server...');
  
  // Close all connections
  io.close(() => {
    console.log('All socket connections closed');
    process.exit(0);
  });
});

// Log any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in socket server:', err);
}); 