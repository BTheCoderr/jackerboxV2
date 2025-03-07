"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface UseSocketOptions {
  enabled?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { enabled = true } = options;
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || status !== "authenticated" || !session?.user) {
      return;
    }

    // Create socket connection
    const socket = io({
      path: "/api/socket",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Store socket reference
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, session, status]);

  // Join a chat room
  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_chat", { chatId });
    }
  }, [isConnected]);

  // Leave a chat room
  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_chat", { chatId });
    }
  }, [isConnected]);

  // Send a message
  const sendMessage = useCallback((chatId: string, message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send_message", { chatId, message });
      return true;
    }
    return false;
  }, [isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", { chatId, isTyping });
    }
  }, [isConnected]);

  // Subscribe to events
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    subscribe,
  };
} 