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
}

const SocketStatusContext = createContext<SocketStatusContextType>({
  status: 'disconnected',
  isConnected: false,
  isReconnecting: false,
  isOffline: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocketStatus = () => useContext(SocketStatusContext);

interface SocketStatusProviderProps {
  children: ReactNode;
}

export function SocketStatusProvider({ children }: SocketStatusProviderProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  
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
    },
    onReconnectFailed: () => {
      setIsOffline(true);
    }
  });

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

  const value = {
    status,
    isConnected,
    isReconnecting: status === 'reconnecting',
    isOffline: isOffline || !networkStatus,
    connect,
    disconnect,
  };

  return (
    <SocketStatusContext.Provider value={value}>
      {children}
    </SocketStatusContext.Provider>
  );
} 