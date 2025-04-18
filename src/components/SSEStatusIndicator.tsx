'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useSSE } from '@/components/providers/SSEProvider';

type SSEStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SSEStatusIndicatorProps {
  status?: SSEStatus;
}

export function SSEStatusIndicator({ status: propStatus }: SSEStatusIndicatorProps) {
  const sseContext = useSSE();
  const [mounted, setMounted] = useState(false);

  // Determine which status to use - prop status takes precedence
  const status = propStatus || sseContext.status;
  
  // Set mounted state after initial render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Status badge color
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 hover:bg-green-600';
      case 'connecting':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'disconnected':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  // Status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 mr-1" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 mr-1" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };
  
  // Don't render anything until client-side to avoid hydration errors
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        className={`cursor-pointer ${getStatusColor()} flex items-center`}
        onClick={() => sseContext.connect()}
      >
        {getStatusIcon()}
        SSE: {status}
      </Badge>
    </div>
  );
} 