"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRootContext } from './root-provider';

/**
 * Connection Status Component
 * Displays the status of the Socket.io and SSE connections
 * and updates the status automatically
 */
export default function ConnectionStatus() {
  const { connectionStatus, updateConnectionStatus } = useRootContext();
  const [socketConnectionChecked, setSocketConnectionChecked] = useState(false);
  const [sseConnectionChecked, setSseConnectionChecked] = useState(false);
  // Use refs to track the previous status to avoid unnecessary updates
  const prevSocketStatus = useRef(connectionStatus.socket);
  const prevSseStatus = useRef(connectionStatus.sse);
  const checkingSocketRef = useRef(false);
  const checkingSSERef = useRef(false);

  // Socket connection monitoring
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') return;

    let socketTimeout = null;

    // Function to check socket
    const checkSocketConnection = () => {
      if (checkingSocketRef.current) return;
      checkingSocketRef.current = true;

      try {
        // Only update the status if it's changed to avoid infinite loops
        if (navigator.onLine && prevSocketStatus.current !== 'connected') {
          if (prevSocketStatus.current !== 'connecting') {
            updateConnectionStatus('socket', 'connecting');
            prevSocketStatus.current = 'connecting';
          }
        } else if (!navigator.onLine && prevSocketStatus.current !== 'disconnected') {
          updateConnectionStatus('socket', 'disconnected');
          prevSocketStatus.current = 'disconnected';
        }

        setSocketConnectionChecked(true);
      } catch (error) {
        console.error('Error checking socket connection:', error);
        if (prevSocketStatus.current !== 'error') {
          updateConnectionStatus('socket', 'error');
          prevSocketStatus.current = 'error';
        }
      } finally {
        checkingSocketRef.current = false;
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      if (prevSocketStatus.current !== 'connected') {
        updateConnectionStatus('socket', 'connected');
        prevSocketStatus.current = 'connected';
      }
    };

    const handleOffline = () => {
      if (prevSocketStatus.current !== 'disconnected') {
        updateConnectionStatus('socket', 'disconnected');
        prevSocketStatus.current = 'disconnected';
      }
    };

    // Set initial status and add listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    if (!socketConnectionChecked) {
      if (navigator.onLine) {
        if (prevSocketStatus.current !== 'connecting') {
          updateConnectionStatus('socket', 'connecting');
          prevSocketStatus.current = 'connecting';
        }
        checkSocketConnection();
      } else {
        if (prevSocketStatus.current !== 'disconnected') {
          updateConnectionStatus('socket', 'disconnected');
          prevSocketStatus.current = 'disconnected';
        }
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (socketTimeout) clearTimeout(socketTimeout);
    };
  }, [updateConnectionStatus, socketConnectionChecked]);

  // SSE connection monitoring
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') return;

    let eventSource = null;
    let reconnectTimeout = null;
    
    const connectSSE = () => {
      if (checkingSSERef.current) return;
      checkingSSERef.current = true;
      
      try {
        // Only update if status changed
        if (prevSseStatus.current !== 'connecting') {
          updateConnectionStatus('sse', 'connecting');
          prevSseStatus.current = 'connecting';
        }
        
        setSseConnectionChecked(true);
      } catch (error) {
        console.error('Error connecting to SSE:', error);
        if (prevSseStatus.current !== 'error') {
          updateConnectionStatus('sse', 'error');
          prevSseStatus.current = 'error';
        }
      } finally {
        checkingSSERef.current = false;
      }
    };
    
    // Connect immediately if online and not already checked
    if (!sseConnectionChecked) {
      if (navigator.onLine) {
        connectSSE();
      } else if (prevSseStatus.current !== 'disconnected') {
        updateConnectionStatus('sse', 'disconnected');
        prevSseStatus.current = 'disconnected';
      }
    }
    
    // Reconnect on online event
    const handleOnline = () => {
      if (prevSseStatus.current !== 'connected' && 
          prevSseStatus.current !== 'connecting') {
        connectSSE();
      }
    };
    
    // Update status on offline event
    const handleOffline = () => {
      if (prevSseStatus.current !== 'disconnected') {
        updateConnectionStatus('sse', 'disconnected');
        prevSseStatus.current = 'disconnected';
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [updateConnectionStatus, sseConnectionChecked]);

  // Get status classes
  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-blue-500';
      case 'reconnecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = (type, status) => {
    const typeName = type === 'socket' ? 'Socket' : 'SSE';
    return `${typeName}: ${status}`;
  };

  return (
    <div className="fixed bottom-0 right-0 flex gap-2 p-2 text-xs text-white z-50 opacity-80 hover:opacity-100 transition-opacity">
      <div className={`px-2 py-1 rounded ${getStatusClass(connectionStatus.socket)}`}>
        {getStatusText('socket', connectionStatus.socket)}
      </div>
      <div className={`px-2 py-1 rounded ${getStatusClass(connectionStatus.sse)}`}>
        {getStatusText('sse', connectionStatus.sse)}
      </div>
    </div>
  );
} 