// Socket.io server for real-time communication
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.SOCKET_PORT || 3002;

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Connection event
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Join a chat room
  socket.on('join_chat', (chatId) => {
    console.log(`Socket ${socket.id} joined chat: ${chatId}`);
    socket.join(chatId);
  });
  
  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    console.log(`Socket ${socket.id} left chat: ${chatId}`);
    socket.leave(chatId);
  });
  
  // Send a message
  socket.on('send_message', (data) => {
    console.log(`Message sent in chat ${data.chatId}: ${data.message}`);
    io.to(data.chatId).emit('receive_message', data);
  });
  
  // User typing indicator
  socket.on('typing', (data) => {
    console.log(`User typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit('user_typing', data);
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`WebSocket path: /socket.io`);
}); 