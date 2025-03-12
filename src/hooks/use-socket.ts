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

export function useSocket(): UseSocketReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

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
      
      // Create a new socket connection
      // Use the proxy route instead of connecting directly to the socket server
      const socketInstance = io({
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Prefer WebSocket transport
        transports: ['websocket', 'polling'],
      });

      // Set up event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setStatus('connected');
        setError(null);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setStatus('error');
        setError(err);
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