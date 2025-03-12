"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { useSession } from "next-auth/react";

interface UseSocketOptions {
  enabled?: boolean;
  debug?: boolean;
}

// Try to connect to these ports in order
const SOCKET_PORTS = [3001, 3002, 3003, 3004, 3005];

// Extended socket options interface to include all the options we're using
interface ExtendedSocketOptions extends Partial<ManagerOptions & SocketOptions> {
  path?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  transports?: string[];
  withCredentials?: boolean;
  timeout?: number;
  pingInterval?: number;
  pingTimeout?: number;
  forceNew?: boolean;
  extraHeaders?: Record<string, string>;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { enabled = true, debug = false } = options;
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPortIndex, setCurrentPortIndex] = useState(0);
  const MAX_RETRIES = 3;

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[Socket] ${message}`, ...args);
    }
  }, [debug]);

  // Try to connect to a different port
  const tryNextPort = useCallback(() => {
    if (currentPortIndex < SOCKET_PORTS.length - 1) {
      setCurrentPortIndex(prev => prev + 1);
      setRetryCount(0);
      return true;
    }
    return false;
  }, [currentPortIndex]);

  // Get the socket server URL for the current port
  const getSocketServerUrl = useCallback((port: number) => {
    // Use the hostname from the current window location
    const hostname = window.location.hostname;
    return `http://${hostname}:${port}`;
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || status !== "authenticated" || !session?.user) {
      return;
    }

    // Clean up any existing socket
    if (socketRef.current) {
      log('Cleaning up existing socket before creating a new one');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Use the proxy route instead of connecting directly to the socket server
    const serverUrl = window.location.origin; // This will be http://localhost:3000
    log(`Initializing socket connection to ${serverUrl} (via proxy)...`);

    // Create socket connection with properly typed options
    const socketOptions: ExtendedSocketOptions = {
      path: "/api/socket",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Only use websocket transport by default, no polling
      transports: ["websocket"],
      withCredentials: true,
      timeout: 10000, // Increase timeout to 10 seconds
      // Increase ping intervals to reduce polling frequency
      pingInterval: 60000, // 60 seconds
      pingTimeout: 30000,  // 30 seconds
      forceNew: true,      // Force a new connection
    };

    const socket = io(serverUrl, socketOptions);

    // Set up event listeners
    socket.on("connect", () => {
      log(`Socket connected successfully to ${serverUrl} (via proxy)`);
      setIsConnected(true);
      setRetryCount(0);
      setIsPollingFallback(false);
    });

    socket.on("disconnect", (reason) => {
      log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      log(`Socket connection error to ${serverUrl} (via proxy):`, error);
      setIsConnected(false);
      
      // If we've tried a few times and still can't connect with websocket,
      // fall back to polling
      if (retryCount >= MAX_RETRIES) {
        if (!isPollingFallback) {
          // Fall back to polling
          log('Switching to polling fallback mode');
          setIsPollingFallback(true);
          socket.disconnect();
          
          // Reconnect with polling only, but with much less frequent polling
          const pollingOptions = { ...socketOptions };
          pollingOptions.transports = ["polling", "websocket"];
          // Set a very long polling interval to reduce requests
          pollingOptions.extraHeaders = {
            "X-Socket-Transport": "polling-fallback"
          };
          
          // Create a new socket with polling options
          const pollingSocket = io(serverUrl, pollingOptions);
          socketRef.current = pollingSocket;
          
          // Set up the same event listeners for the new socket
          pollingSocket.on("connect", () => {
            log(`Socket connected successfully to ${serverUrl} (polling)`);
            setIsConnected(true);
            setRetryCount(0);
          });
          
          pollingSocket.on("disconnect", (reason) => {
            log('Socket disconnected (polling):', reason);
            setIsConnected(false);
          });
          
          pollingSocket.on("connect_error", (error) => {
            log(`Socket connection error to ${serverUrl} (polling):`, error);
            setIsConnected(false);
          });
          
          return;
        }
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
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(event, callback);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Add a reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      log('Manually reconnecting socket');
      socketRef.current.connect();
    }
  }, [log]);

  // Reset and try all ports again
  const resetConnection = useCallback(() => {
    log('Resetting socket connection');
    setRetryCount(0);
    setIsPollingFallback(false);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Force a re-initialization of the socket
    setRetryCount(0);
  }, [log]);

  // Return socket and connection state
  return {
    socket: socketRef.current,
    isConnected,
    isPollingFallback,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    reconnect,
    resetConnection,
    subscribe,
    emit: useCallback((event: string, ...args: any[]) => {
      if (!socketRef.current || !isConnected) return false;
      socketRef.current.emit(event, ...args);
      return true;
    }, [isConnected])
  };
} 