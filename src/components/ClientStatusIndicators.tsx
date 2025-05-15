'use client';

import { useSocket } from '@/hooks/use-socket';
import { useEffect, useState } from 'react';

export function ClientStatusIndicators() {
  const [sseStatus, setSSEStatus] = useState<string>('');
  const { status: socketStatus } = useSocket();
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev) return; // Only run in development

    const eventSource = new EventSource('/api/sse');
    
    eventSource.onopen = () => {
      setSSEStatus('connected');
    };
    
    eventSource.onerror = () => {
      setSSEStatus('error');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close();
        new EventSource('/api/sse');
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [isDev]);

  // Only show status indicators in development
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      {socketStatus === 'connecting' && (
        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
          Socket: reconnecting...
        </div>
      )}
      {socketStatus === 'connected' && (
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
          Socket: connected
        </div>
      )}
      {sseStatus === 'connected' && (
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
          SSE: connected
        </div>
      )}
      {sseStatus === 'error' && (
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          SSE: reconnecting...
        </div>
      )}
    </div>
  );
} 