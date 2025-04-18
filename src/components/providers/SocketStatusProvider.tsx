"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSocket, SocketStatus } from '@/hooks/use-socket';

// Socket status context
interface SocketStatusContextType {
  status: SocketStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  isOffline: boolean;
  connect: () => void;
  disconnect: () => void;
  forceReconnect: () => void;
}

const SocketStatusContext = createContext<SocketStatusContextType>({
  status: 'disconnected',
  isConnected: false,
  isReconnecting: false,
  isOffline: false,
  connect: () => {},
  disconnect: () => {},
  forceReconnect: () => {},
});

export const useSocketStatus = () => useContext(SocketStatusContext);

interface SocketStatusProviderProps {
  children: ReactNode;
}

export function SocketStatusProvider({ children }: SocketStatusProviderProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    status,
    isConnected,
    connect,
    disconnect,
  } = useSocket({
    autoConnect: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    onConnect: () => {
      setIsOffline(false);
      setRetryCount(0);
    },
    onDisconnect: (reason) => {
      // Only set offline if the network is actually offline
      // or if the disconnect reason indicates a server issue
      if (!navigator.onLine || 
          reason === 'transport error' || 
          reason === 'transport close') {
        setIsOffline(true);
      }
    },
    onReconnect: () => {
      setIsOffline(false);
      setRetryCount(0);
    },
    onReconnectFailed: () => {
      setIsOffline(true);
    }
  });

  // Force reconnect function
  const forceReconnect = () => {
    disconnect();
    setTimeout(() => {
      connect();
      setRetryCount(prev => prev + 1);
    }, 500);
  };

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      setIsOffline(false);
      // Try to reconnect when network comes back
      if (status !== 'connected') {
        connect();
      }
    };

    const handleOffline = () => {
      setNetworkStatus(false);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, connect]);

  // Auto-retry connection with exponential backoff
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    
    if (status === 'error' || status === 'disconnected') {
      const delay = Math.min(1000 * (2 ** retryCount), 30000); // Max 30 seconds
      
      reconnectTimeout = setTimeout(() => {
        if (navigator.onLine && (status === 'error' || status === 'disconnected')) {
          forceReconnect();
        }
      }, delay);
    }
    
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [status, retryCount]);

  const value = {
    status,
    isConnected,
    isReconnecting: status === 'reconnecting',
    isOffline: isOffline || !networkStatus,
    connect,
    disconnect,
    forceReconnect,
  };

  return (
    <SocketStatusContext.Provider value={value}>
      {children}
    </SocketStatusContext.Provider>
  );
} 