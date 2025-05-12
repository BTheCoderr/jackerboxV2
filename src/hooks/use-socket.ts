"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { useSession } from "next-auth/react";

// Define the socket connection status
export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Define the socket hook return type
export interface UseSocketReturn {
  socket: Socket | null;
  status: SocketStatus;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isPollingFallback: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (event: string, data: any) => void;
  subscribe: <T>(event: string, callback: (data: T) => void) => () => void;
}

// Helper to determine if we're in production
const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         typeof window !== 'undefined' && window.location.hostname !== 'localhost';
};

// Helper to get the socket server port in development
const getSocketServerPort = (): number => {
  // In development, the socket server runs on port 3002 as shown in the logs
  return 3002;
};

// Socket hook options
export interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  events?: string[];
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
  onReconnectAttempt?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

/**
 * Custom hook for Socket.IO
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    events = [],
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
    onReconnectAttempt,
    onReconnectFailed,
  } = options;

  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventsRef = useRef<string[]>(events);
  const isConnectingRef = useRef(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update events ref when events change
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  /**
   * Initialize socket connection
   */
  const initSocket = useCallback(() => {
    // Skip connection if disabled
    if (process.env.NEXT_PUBLIC_DISABLE_SOCKET === 'true') {
      console.log('Socket connections are disabled in this environment');
      return;
    }

    // For production environment, use the real socket connection
    // This uses the Upstash Redis connection
    if (process.env.NODE_ENV === 'production') {
      try {
        // Skip connection attempts if already connecting or connected
        if (isConnectingRef.current || socketRef.current) {
          return;
        }

        isConnectingRef.current = true;
        setStatus('connecting');
        
        // Use upstash Redis URL from environment variables
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        
        const socket = io(socketUrl, {
          path: '/api/socket',
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
        });
        
        // Set up event listeners
        socket.on('connect', () => {
          console.log('Socket connected successfully');
          console.log('Socket ID:', socket.id);
          console.log('Transport:', socket.io.engine.transport.name);
          
          isConnectingRef.current = false;
          reconnectAttemptsRef.current = 0;
          setStatus('connected');
          setError(null);
          setIsReady(true);
          
          if (onConnect) {
            onConnect();
          }
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          
          if (status !== 'error') {
            setStatus('error');
            setError(new Error(`Connection error: ${err.message}`));
            
            if (onError) {
              onError(new Error(`Connection error: ${err.message}`));
            }
          }
          
          // Don't set isConnecting to false here to allow reconnection
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            // The server/client has forcefully disconnected the socket
            isConnectingRef.current = false;
            setStatus('disconnected');
            setIsReady(false);
          } else {
            // Socket will automatically try to reconnect
            setStatus('reconnecting');
          }
          
          if (onDisconnect) {
            onDisconnect(reason);
          }
        });

        socket.on('reconnect', (attempt) => {
          console.log(`Socket reconnected after ${attempt} attempts`);
          setStatus('connected');
          setError(null);
          
          if (onReconnect) {
            onReconnect();
          }
        });

        socket.on('reconnect_attempt', (attempt) => {
          console.log(`Socket reconnection attempt ${attempt}/${reconnectionAttempts}`);
          
          if (onReconnectAttempt) {
            onReconnectAttempt(attempt);
          }
        });

        socket.on('reconnect_error', (err) => {
          console.error('Socket reconnection error:', err);
          
          if (onError) {
            onError(new Error(`Reconnection error: ${err.message}`));
          }
        });

        socket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed after all attempts');
          isConnectingRef.current = false;
          setStatus('error');
          setError(new Error('Failed to reconnect after multiple attempts'));
          
          if (onReconnectFailed) {
            onReconnectFailed();
          }
        });

        socket.on('error', (err) => {
          console.error('Socket error:', err);
          setError(new Error(`Socket error: ${err.message}`));
          
          if (onError) {
            onError(new Error(`Socket error: ${err.message}`));
          }
        });

        // Handle transport upgrade
        socket.io.engine.on('upgrade', (transport) => {
          console.log('Transport upgraded to:', transport);
        });

        // Store socket instance
        socketRef.current = socket;
        setSocket(socket);
        
        // Return cleanup function
        return () => {
          if (socketRef.current) {
            console.log('Cleaning up socket connection');
            
            // Unsubscribe from all events
            eventsRef.current.forEach((event) => {
              socketRef.current?.off(event);
            });
            
            // Disconnect socket
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setStatus('disconnected');
            setIsReady(false);
            isConnectingRef.current = false;
          }
          
          // Clear any pending reconnect timers
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        };
      } catch (error) {
        console.error('Socket connection error:', error);
        setStatus('error');
        isConnectingRef.current = false;
      }
    } else {
      // For development, use a simulated connection to avoid console warnings
      setStatus('connected');
      setIsReady(true);
    }
  }, [
    session,
    reconnectionAttempts,
    reconnectionDelay,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
    onReconnectAttempt,
    onReconnectFailed,
    status,
  ]);

  /**
   * Connect to socket server
   */
  const connect = useCallback(() => {
    if (status === 'connected' || isConnectingRef.current) {
      return;
    }
    
    initSocket();
  }, [initSocket, status]);

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(() => {
    if (!socketRef.current) {
      return;
    }
    
    socketRef.current.disconnect();
  }, []);

  /**
   * Subscribe to an event
   */
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn(`Cannot subscribe to event "${event}": Socket not connected`);
      return () => {};
    }
    
    console.log(`Subscribing to event: ${event}`);
    socketRef.current.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      console.log(`Unsubscribing from event: ${event}`);
      socketRef.current?.off(event, callback);
    };
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socketRef.current || !isReady) {
      console.warn(`Cannot emit event "${event}": Socket not ready`);
      return false;
    }
    
    socketRef.current.emit(event, ...args);
    return true;
  }, [isReady]);

  /**
   * Join a room
   */
  const joinRoom = useCallback((room: string) => {
    if (!socketRef.current || !isReady) {
      console.warn(`Cannot join room "${room}": Socket not ready`);
      return false;
    }
    
    console.log(`Joining chat room: ${room}`);
    socketRef.current.emit('join_room', room);
    return true;
  }, [isReady]);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((room: string) => {
    if (!socketRef.current) {
      return false;
    }
    
    console.log(`Leaving chat room: ${room}`);
    socketRef.current.emit('leave_room', room);
    return true;
  }, []);

  // Initialize socket on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      initSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [autoConnect, initSocket]);

  // Subscribe to events
  useEffect(() => {
    if (!socketRef.current || !isReady) {
      return;
    }
    
    const unsubscribers = eventsRef.current.map((event) => {
      console.log(`Auto-subscribing to event: ${event}`);
      
      const handler = (...args: any[]) => {
        // This is just a placeholder handler to ensure the event is registered
        // Actual handlers should be registered using the subscribe method
      };
      
      socketRef.current?.on(event, handler);
      
      return () => {
        socketRef.current?.off(event, handler);
      };
    });
    
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isReady]);

  return {
    socket: socketRef.current,
    status,
    error,
    connect,
    disconnect,
    isConnected: status === 'connected',
    isPollingFallback,
    joinChat: joinRoom,
    leaveChat: leaveRoom,
    sendMessage: emit,
    subscribe,
  };
} 