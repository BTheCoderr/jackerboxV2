import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocketServer = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    
    // Store the Socket.io server instance
    res.socket.server.io = io;
    
    // Set up authentication middleware
    io.use(async (socket, next) => {
      try {
        const session = await getSession({ req: socket.request as any });
        
        if (!session || !session.user) {
          return next(new Error("Unauthorized"));
        }
        
        // Attach user data to the socket
        socket.data.user = session.user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
    
    // Handle connections
    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Join user's room for private messages
      if (socket.data.user?.id) {
        socket.join(`user:${socket.data.user.id}`);
      }
      
      // Handle joining a chat room
      socket.on("join_chat", (data) => {
        const { chatId } = data;
        socket.join(`chat:${chatId}`);
        console.log(`Socket ${socket.id} joined chat:${chatId}`);
      });
      
      // Handle leaving a chat room
      socket.on("leave_chat", (data) => {
        const { chatId } = data;
        socket.leave(`chat:${chatId}`);
        console.log(`Socket ${socket.id} left chat:${chatId}`);
      });
      
      // Handle sending a message
      socket.on("send_message", (data) => {
        const { chatId, message } = data;
        
        // Broadcast to all users in the chat room
        io.to(`chat:${chatId}`).emit("receive_message", {
          ...message,
          sender: {
            id: socket.data.user.id,
            name: socket.data.user.name,
            image: socket.data.user.image,
          },
        });
        
        // Also send to the recipient's personal room
        if (message.receiverId) {
          io.to(`user:${message.receiverId}`).emit("new_message_notification", {
            ...message,
            sender: {
              id: socket.data.user.id,
              name: socket.data.user.name,
              image: socket.data.user.image,
            },
          });
        }
      });
      
      // Handle typing indicator
      socket.on("typing", (data) => {
        const { chatId, isTyping } = data;
        
        // Broadcast typing status to all users in the chat room except sender
        socket.to(`chat:${chatId}`).emit("user_typing", {
          userId: socket.data.user.id,
          userName: socket.data.user.name,
          isTyping,
        });
      });
      
      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
  
  return res.socket.server.io;
}; 