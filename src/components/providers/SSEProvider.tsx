'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { SSEStatusIndicator } from '@/components/SSEStatusIndicator';

// Connection status types
type SSEStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Context for SSE state
interface SSEContextType {
  status: SSEStatus;
  connect: () => void;
  disconnect: () => void;
  lastError?: Error;
}

const SSEContext = createContext<SSEContextType>({
  status: 'disconnected',
  connect: () => {},
  disconnect: () => {},
});

export const useSSE = () => useContext(SSEContext);

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const [lastError, setLastError] = useState<Error | undefined>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [suppressLogs, setSuppressLogs] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  // Optimized connect function with debounce
  const connect = () => {
    // Skip in development environment
    if (process.env.NODE_ENV === 'development') {
      // Mock a successful connection in development
      setStatus('connected');
      console.log('SSE connections disabled in development environment - using mock connection');
      return;
    }
    
    // Prevent simultaneous reconnection attempts
    if (isReconnectingRef.current) return;
    
    // Clean up existing connection if any
    disconnect();
    
    // Set reconnecting flag
    isReconnectingRef.current = true;
    
    try {
      setStatus('connecting');
      const es = new EventSource('/api/sse', { 
        withCredentials: true // Important for auth
      });
      
      es.onopen = () => {
        setStatus('connected');
        setRetryCount(0);
        setLastError(undefined);
        isReconnectingRef.current = false;
        
        if (!suppressLogs && process.env.NODE_ENV === 'development') {
          console.log('SSE connection established');
          
          if (retryCount > 3) {
            setSuppressLogs(true);
            setTimeout(() => setSuppressLogs(false), 60000);
          }
        }
      };
      
      es.onerror = (error) => {
        const errorObj = error instanceof Error ? error : new Error('SSE connection error');
        setLastError(errorObj);
        
        if (!suppressLogs) {
          console.error('SSE connection error:', errorObj);
        }
        
        setStatus('error');
        es.close();
        isReconnectingRef.current = false;
        
        // Only auto-retry if online and not too many retries
        if (navigator.onLine && retryCount < 5) {
          const delay = Math.min(1000 * (2 ** retryCount), 30000);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, delay);
        }
      };
      
      es.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'error') {
            setLastError(new Error(data.message || 'Unknown SSE error'));
            setStatus('error');
            return;
          }
          
          // Only log non-heartbeat messages
          if (data.type !== 'heartbeat' && !suppressLogs) {
            console.log('SSE message received:', data);
          }
        } catch (error) {
          if (!suppressLogs) {
            console.error('Error parsing SSE message:', error);
          }
          setLastError(error instanceof Error ? error : new Error('Failed to parse SSE message'));
        }
      });
      
      eventSourceRef.current = es;
    } catch (error) {
      if (!suppressLogs) {
        console.error('Failed to create SSE connection:', error);
      }
      setStatus('error');
      setLastError(error instanceof Error ? error : new Error('Failed to create SSE connection'));
      isReconnectingRef.current = false;
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
      setLastError(undefined);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    if (navigator.onLine) {
      connect();
    }
    
    const handleOnline = () => {
      if (status !== 'connected') {
        connect();
      }
    };
    
    const handleOffline = () => {
      if (eventSourceRef.current) {
        disconnect();
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status !== 'connected') {
        connect();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      disconnect();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value = {
    status,
    connect,
    disconnect,
    lastError
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
      {mounted && <SSEStatusIndicator status={status} />}
    </SSEContext.Provider>
  );
}