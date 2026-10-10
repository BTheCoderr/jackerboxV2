import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Context type
interface RootContextType {
  isPageChanging: boolean;
  startPageTransition: () => void;
  endPageTransition: () => void;
  connectionStatus: {
    socket: 'connected' | 'disconnected' | 'connecting' | 'error';
    sse: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';
  };
  updateConnectionStatus: (type: 'socket' | 'sse', status: string) => void;
}

// Create context with default values
const RootContext = createContext<RootContextType>({
  isPageChanging: false,
  startPageTransition: () => {},
  endPageTransition: () => {},
  connectionStatus: {
    socket: 'connecting',
    sse: 'connecting'
  },
  updateConnectionStatus: () => {}
});

// Hook to use the context
export const useRootContext = () => useContext(RootContext);

// Main provider component
export default function RootProvider({ children }: { children: ReactNode }) {
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<RootContextType['connectionStatus']>({
    socket: 'connecting',
    sse: 'connecting'
  });
  
  // Refs to track previous status and prevent infinite updates
  const prevSocketStatus = useRef(connectionStatus.socket);
  const prevSseStatus = useRef(connectionStatus.sse);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [toastShown, setToastShown] = useState(false);

  // Monitor page transitions to reduce unnecessary API calls
  useEffect(() => {
    // Function to handle the start of a route change
    const handleRouteChangeStart = () => {
      setIsPageChanging(true);
    };

    // Add event listeners for route changes
    window.addEventListener('beforeunload', handleRouteChangeStart);
    
    // Note: Next.js App Router doesn't have the same router events as Pages Router
    // So we're using a manual approach with our context

    return () => {
      window.removeEventListener('beforeunload', handleRouteChangeStart);
    };
  }, []);

  // Manage connection statuses with debounced toasts
  useEffect(() => {
    const showConnectionToast = () => {
      const socketStatus = connectionStatus.socket;
      const sseStatus = connectionStatus.sse;
      
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      if (socketStatus === 'error' || sseStatus === 'error') {
        if (!toastShown) {
          toast.error('Connection error', {
            description: 'There was a problem connecting to the server. Some features may not work properly.',
            duration: 3000
          });
          setToastShown(true);
        }
      } else if (socketStatus === 'disconnected' || sseStatus === 'disconnected') {
        toastTimeoutRef.current = setTimeout(() => {
          if (!toastShown) {
            toast.warning('Connection lost', {
              description: 'Attempting to reconnect...',
              duration: 3000
            });
            setToastShown(true);
          }
        }, 2000); // Wait 2 seconds before showing to avoid flickering
      } else if ((socketStatus === 'connected' && sseStatus === 'connected') && toastShown) {
        toast.success('Connection restored', {
          description: 'You are back online.',
          duration: 3000
        });
        setToastShown(false);
      }
    };

    showConnectionToast();

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [connectionStatus, toastShown]);

  // Function to update connection status
  const updateConnectionStatus = useCallback((type: 'socket' | 'sse', status: string) => {
    const currentValue = type === 'socket' ? prevSocketStatus.current : prevSseStatus.current;
    
    // Only update if the status has changed to prevent infinite loops
    if (currentValue !== status) {
      if (type === 'socket') {
        prevSocketStatus.current = status as any;
      } else {
        prevSseStatus.current = status as any;
      }
      
      setConnectionStatus(prev => ({
        ...prev,
        [type]: status as RootContextType['connectionStatus'][typeof type],
      }));
    }
  }, []);

  // Public methods for page transitions
  const startPageTransition = useCallback(() => {
    setIsPageChanging(true);
  }, []);

  const endPageTransition = useCallback(() => {
    setIsPageChanging(false);
  }, []);

  // Context value
  const contextValue: RootContextType = {
    isPageChanging,
    startPageTransition,
    endPageTransition,
    connectionStatus,
    updateConnectionStatus
  };

  return (
    <RootContext.Provider value={contextValue}>
      {children}
    </RootContext.Provider>
  );
} 