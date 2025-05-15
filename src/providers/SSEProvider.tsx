'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SSEContextType {
  connected: boolean;
}

const SSEContext = createContext<SSEContextType>({ connected: false });

export function useSSE() {
  return useContext(SSEContext);
}

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (typeof window === 'undefined' || isDev) {
      // In development, just set connected to true without attempting connection
      if (isDev) setConnected(true);
      return;
    }

    let eventSource: EventSource | null = null;

    const connect = () => {
      if (eventSource?.readyState === EventSource.OPEN) return;
      
      eventSource = new EventSource('/api/sse');

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setConnected(true);
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnected(false);
        eventSource?.close();
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            toast(data.message);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <SSEContext.Provider value={{ connected }}>
      {children}
    </SSEContext.Provider>
  );
} 