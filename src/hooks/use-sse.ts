import { useEffect, useState, useCallback, useRef } from 'react';

// SSE connection status
export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

// SSE hook options
export interface SSEOptions {
  onConnect?: (clientId: string) => void;
  onMessage?: (data: any) => void;
  onSubscribed?: (topic: string) => void;
  onUnsubscribed?: (topic: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// SSE hook return type
export interface SSEHook {
  status: SSEStatus;
  clientId: string | null;
  error: Error | null;
  subscribedTopics: string[];
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  getStats: () => Promise<any>;
}

/**
 * Hook for using Server-Sent Events (SSE)
 */
export function useSSE(options: SSEOptions = {}): SSEHook {
  // Connection state
  const [status, setStatus] = useState<SSEStatus>('idle');
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);
  
  // Use refs to prevent infinite loops
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Default options
  const {
    onConnect,
    onMessage,
    onSubscribed,
    onUnsubscribed,
    onError,
    onReconnect,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;
  
  /**
   * Connect to the SSE endpoint
   */
  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current || status === 'connected' || status === 'connecting') {
      return;
    }
    
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    isConnectingRef.current = true;
    setStatus('connecting');
    setError(null);
    
    try {
      // Create a new EventSource
      const eventSource = new EventSource('/api/sse');
      eventSourceRef.current = eventSource;
      
      // Connection opened
      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
      };
      
      // Connection error
      eventSource.onerror = (e) => {
        if (!mountedRef.current) return;
        
        console.error('SSE connection error:', e);
        isConnectingRef.current = false;
        
        // Close the connection
        eventSource.close();
        eventSourceRef.current = null;
        
        const connectionError = new Error('SSE connection error');
        setError(connectionError);
        setStatus('error');
        
        if (onError) {
          onError(connectionError);
        }
        
        // Auto reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          setStatus('reconnecting');
          
          if (onReconnect) {
            onReconnect();
          }
          
          reconnectAttemptsRef.current++;
          
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setStatus('disconnected');
        }
      };
      
      // Message received
      eventSource.onmessage = (e) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(e.data);
          
          // Handle different message types
          switch (data.type) {
            case 'connection':
              setClientId(data.clientId);
              setStatus('connected');
              
              if (onConnect) {
                onConnect(data.clientId);
              }
              break;
              
            case 'subscribed':
              setSubscribedTopics(prev => {
                if (prev.includes(data.topic)) {
                  return prev;
                }
                return [...prev, data.topic];
              });
              
              if (onSubscribed) {
                onSubscribed(data.topic);
              }
              break;
              
            case 'unsubscribed':
              setSubscribedTopics(prev => prev.filter(t => t !== data.topic));
              
              if (onUnsubscribed) {
                onUnsubscribed(data.topic);
              }
              break;
              
            case 'message':
              if (onMessage) {
                onMessage(data);
              }
              break;
              
            case 'heartbeat':
              // Heartbeat received, connection is alive
              break;
              
            case 'error':
              console.error('SSE error message:', data.message);
              
              if (onError) {
                onError(new Error(data.message));
              }
              break;
              
            default:
              console.warn('Unknown SSE message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err, e.data);
        }
      };
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      isConnectingRef.current = false;
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [
    autoReconnect,
    maxReconnectAttempts,
    onConnect,
    onError,
    onMessage,
    onReconnect,
    onSubscribed,
    onUnsubscribed,
    reconnectInterval,
    status,
  ]);
  
  /**
   * Disconnect from the SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setStatus('disconnected');
    isConnectingRef.current = false;
  }, []);
  
  /**
   * Reconnect to the SSE endpoint
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);
  
  /**
   * Subscribe to a topic
   */
  const subscribe = useCallback((topic: string) => {
    if (!clientId || status !== 'connected') {
      console.warn('Cannot subscribe: Not connected to SSE');
      return;
    }
    
    fetch('/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        action: 'subscribe',
        topic,
      }),
    }).catch(err => {
      console.error('Error subscribing to topic:', err);
    });
  }, [clientId, status]);
  
  /**
   * Unsubscribe from a topic
   */
  const unsubscribe = useCallback((topic: string) => {
    if (!clientId || status !== 'connected') {
      console.warn('Cannot unsubscribe: Not connected to SSE');
      return;
    }
    
    fetch('/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        action: 'unsubscribe',
        topic,
      }),
    }).catch(err => {
      console.error('Error unsubscribing from topic:', err);
    });
  }, [clientId, status]);
  
  /**
   * Get SSE stats
   */
  const getStats = useCallback(async () => {
    if (!clientId) {
      console.warn('Cannot get stats: No client ID');
      return null;
    }
    
    try {
      const response = await fetch('/api/sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          action: 'stats',
        }),
      });
      
      return await response.json();
    } catch (err) {
      console.error('Error getting SSE stats:', err);
      return null;
    }
  }, [clientId]);
  
  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();
    
    // Clean up on unmount
    return () => {
      mountedRef.current = false;
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);
  
  return {
    status,
    clientId,
    error,
    subscribedTopics,
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    getStats,
  };
} 