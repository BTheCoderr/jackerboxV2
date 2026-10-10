'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SSEStatusIndicator } from '@/components/SSEStatusIndicator';

type SSEStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

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

const MAX_RETRIES = 5;
const MAX_RETRY_DELAY_MS = 30000;

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const [lastError, setLastError] = useState<Error | undefined>();
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptsRef = useRef(0);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeStream = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimer();
    closeStream();
    retryAttemptsRef.current = 0;
    setStatus('disconnected');
    setLastError(undefined);
  }, [clearReconnectTimer, closeStream]);

  const connect = useCallback(() => {
    // /api/sse requires an authenticated session. Guests must never connect
    // or retry: an HTTP 401 is expected for a signed-out visitor.
    if (sessionStatus !== 'authenticated') return;
    if (typeof window === 'undefined' || !navigator.onLine) {
      setStatus('disconnected');
      return;
    }
    if (sourceRef.current && sourceRef.current.readyState !== EventSource.CLOSED) {
      return;
    }

    clearReconnectTimer();
    setStatus('connecting');

    try {
      const source = new EventSource('/api/sse', { withCredentials: true });
      sourceRef.current = source;

      source.onopen = () => {
        if (sourceRef.current !== source) return;
        retryAttemptsRef.current = 0;
        setLastError(undefined);
        setStatus('connected');
      };

      source.onerror = () => {
        if (sourceRef.current !== source) return;

        // Netlify/serverless streaming may close or time out. Reconnect a
        // limited number of times rather than looping forever.
        source.close();
        sourceRef.current = null;
        setLastError(new Error('Real-time event connection unavailable'));

        if (!navigator.onLine) {
          setStatus('disconnected');
          return;
        }
        if (retryAttemptsRef.current >= MAX_RETRIES) {
          setStatus('error');
          return;
        }

        const delay = Math.min(1000 * (2 ** retryAttemptsRef.current), MAX_RETRY_DELAY_MS);
        retryAttemptsRef.current += 1;
        setStatus('connecting');
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, delay);
      };

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'error') {
            setLastError(new Error(payload.message || 'SSE stream error'));
            setStatus('error');
          }
        } catch {
          // Ignore malformed diagnostic messages without taking down the app.
        }
      };
    } catch (error) {
      closeStream();
      setStatus('error');
      setLastError(error instanceof Error ? error : new Error('Unable to open real-time events'));
    }
  }, [sessionStatus, clearReconnectTimer, closeStream]);

  useEffect(() => {
    setMounted(true);

    if (sessionStatus !== 'authenticated') {
      disconnect();
      return;
    }

    connect();

    const handleOnline = () => connect();
    const handleOffline = () => disconnect();
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisible);
      disconnect();
    };
  }, [sessionStatus, connect, disconnect]);

  return (
    <SSEContext.Provider value={{ status, connect, disconnect, lastError }}>
      {children}
      {/* Diagnostic overlay belongs in local development, not on user screens. */}
      {mounted && process.env.NODE_ENV === 'development' && sessionStatus === 'authenticated' && (
        <SSEStatusIndicator status={status} />
      )}
    </SSEContext.Provider>
  );
}
