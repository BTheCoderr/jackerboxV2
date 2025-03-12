"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface UseSocketOptions {
  enabled?: boolean;
  debug?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { enabled = true, debug = false } = options;
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[Socket] ${message}`, ...args);
    }
  }, [debug]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || status !== "authenticated" || !session?.user) {
      return;
    }

    log('Initializing socket connection...');

    // Create socket connection
    const socket = io({
      path: "/api/socket",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Only use websocket transport by default, no polling
      transports: ["websocket"],
      withCredentials: true,
      timeout: 10000, // Increase timeout to 10 seconds
      // Increase ping intervals to reduce frequency
      pingInterval: 60000, // 60 seconds
      pingTimeout: 30000,  // 30 seconds
      forceNew: true,      // Force a new connection
    } as any);

    // Set up event listeners
    socket.on("connect", () => {
      log('Socket connected successfully');
      setIsConnected(true);
      setRetryCount(0);
      setIsPollingFallback(false);
    });

    socket.on("disconnect", (reason) => {
      log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      log('Socket connection error:', error);
      setIsConnected(false);
      
      // If we've tried a few times and still can't connect with websocket,
      // only then fall back to polling as a last resort
      if (retryCount >= MAX_RETRIES && !isPollingFallback) {
        log('Switching to polling fallback mode after multiple failed attempts');
        setIsPollingFallback(true);
        socket.disconnect();
        
        // Reconnect with polling only, but with much less frequent polling
        socket.io.opts.transports = ["polling", "websocket"];
        // Set a very long polling interval to reduce requests
        (socket.io as any).opts.extraHeaders = {
          "X-Socket-Transport": "polling-fallback"
        };
        socket.connect();
      } else {
        setRetryCount(prev => prev + 1);
        log(`Connection retry ${retryCount + 1}/${MAX_RETRIES}`);
      }
    });

    // Handle reconnection attempts
    socket.io.on("reconnect_attempt", (attempt) => {
      log(`Reconnection attempt ${attempt}`);
    });

    socket.io.on("reconnect", (attempt) => {
      log(`Reconnected after ${attempt} attempts`);
      setIsConnected(true);
      setIsPollingFallback(false);
    });

    socket.io.on("reconnect_error", (error) => {
      log('Reconnection error:', error);
    });

    socket.io.on("reconnect_failed", () => {
      log('Failed to reconnect after all attempts');
      setIsPollingFallback(true);
    });

    // Add a listener for transport changes
    socket.io.engine?.on("upgrade", (transport: any) => {
      log(`Transport upgraded to: ${typeof transport === 'string' ? transport : transport.name}`);
      const transportName = typeof transport === 'string' ? transport : transport.name;
      if (transportName === "websocket") {
        setIsPollingFallback(false);
      }
    });

    // Store socket reference
    socketRef.current = socket;

    // Add visibility change listener to disconnect when tab is not active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        log('Tab not active, disconnecting socket to save resources');
        socket.disconnect();
      } else if (document.visibilityState === 'visible') {
        log('Tab active again, reconnecting socket');
        socket.connect();
      }
    };

    // Add online/offline listener
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        log('Browser is online, reconnecting socket');
        socket.connect();
      } else {
        log('Browser is offline, disconnecting socket');
        socket.disconnect();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Clean up on unmount
    return () => {
      log('Cleaning up socket connection');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, session, status, retryCount, isPollingFallback, log]);

  // Join a chat room
  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      log(`Joining chat room: ${chatId}`);
      socketRef.current.emit("join_chat", { chatId });
      return true;
    }
    log(`Failed to join chat room: ${chatId} (not connected)`);
    return false;
  }, [isConnected, log]);

  // Leave a chat room
  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      log(`Leaving chat room: ${chatId}`);
      socketRef.current.emit("leave_chat", { chatId });
      return true;
    }
    return false;
  }, [isConnected, log]);

  // Send a message
  const sendMessage = useCallback((chatId: string, message: any) => {
    if (socketRef.current && isConnected) {
      log(`Sending message to chat: ${chatId}`);
      socketRef.current.emit("send_message", { chatId, message });
      return true;
    }
    log(`Failed to send message to chat: ${chatId} (not connected)`);
    return false;
  }, [isConnected, log]);

  // Send typing indicator
  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      log(`Sending typing indicator to chat: ${chatId} (${isTyping ? 'typing' : 'stopped typing'})`);
      socketRef.current.emit("typing", { chatId, isTyping });
      return true;
    }
    return false;
  }, [isConnected, log]);

  // Subscribe to events
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      log(`Subscribing to event: ${event}`);
      socketRef.current.on(event, callback);
    }

    return () => {
      if (socketRef.current) {
        log(`Unsubscribing from event: ${event}`);
        socketRef.current.off(event, callback);
      }
    };
  }, [log]);

  // Add a reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      log('Manually reconnecting socket...');
      socketRef.current.connect();
    }
  }, [log]);

  return {
    socket: socketRef.current,
    isConnected,
    isPollingFallback,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    subscribe,
    reconnect,
  };
} 