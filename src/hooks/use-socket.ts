"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { useSession } from "next-auth/react";

// Define the socket connection status
export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Define the socket hook return type
export interface UseSocketReturn {
  socket: Socket | null;
  status: SocketStatus;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

// Helper to determine if we're in production
const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         typeof window !== 'undefined' && window.location.hostname !== 'localhost';
};

export function useSocket(): UseSocketReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to the socket server
  const connect = useCallback(() => {
    if (sessionStatus !== 'authenticated' || !session) {
      setError(new Error('Not authenticated'));
      return;
    }

    if (socket) {
      // If already connected, do nothing
      return;
    }

    try {
      setStatus('connecting');
      console.log('Connecting to socket server...');
      
      // Determine if we're in production
      const isProd = isProduction();
      console.log(`Environment detected: ${isProd ? 'production' : 'development'}`);
      
      // Get the base URL
      const baseUrl = isProd 
        ? window.location.origin 
        : 'http://localhost:3000';
      
      console.log(`Using base URL: ${baseUrl}`);
      
      // Create a new socket connection
      const socketInstance = io(baseUrl, {
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // In production, use only polling to avoid WebSocket connection issues
        // In development, prefer websocket with polling fallback
        transports: isProd ? ['polling'] : ['websocket', 'polling'],
        // Additional options for better reliability
        forceNew: true,
        // Explicitly set EIO version to 4
        EIO: 4,
      });

      // Set up event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        if (socketInstance.io.engine) {
          console.log(`Transport: ${socketInstance.io.engine.transport.name}`);
        }
        setStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setStatus('error');
        setError(err);
        
        // Increment reconnect attempts
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log(`Max reconnect attempts (${maxReconnectAttempts}) reached, giving up`);
          socketInstance.disconnect();
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setStatus('disconnected');
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error:', err);
        setStatus('error');
        setError(new Error(err));
      });

      // Log transport changes
      if (socketInstance.io.engine) {
        socketInstance.io.engine.on('upgrade', (transport) => {
          console.log(`Transport upgraded to: ${transport}`);
        });
      }

      // Store the socket instance
      setSocket(socketInstance);
    } catch (err: any) {
      console.error('Error creating socket:', err);
      setStatus('error');
      setError(err);
    }
  }, [session, sessionStatus, socket]);

  // Disconnect from the socket server
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus('disconnected');
    }
  }, [socket]);

  // Connect when the session is authenticated
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !socket) {
      connect();
    }

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionStatus, socket, connect]);

  return {
    socket,
    status,
    error,
    connect,
    disconnect,
  };
} 