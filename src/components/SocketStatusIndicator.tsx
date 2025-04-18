"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff, Wifi, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useSocketStatus } from '@/components/providers/SocketStatusProvider';

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SocketStatusIndicatorProps {
  status?: SocketStatus;
  showDetails?: boolean;
}

export function SocketStatusIndicator({ 
  status: propStatus,
  showDetails: initialShowDetails = false 
}: SocketStatusIndicatorProps) {
  const socketContext = useSocketStatus();
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [mounted, setMounted] = useState(false);
  
  // Determine which status to use - prop status takes precedence
  const status = propStatus || socketContext.status;
  
  // Set mounted state after initial render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close details panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.socket-status-indicator') && showDetails) {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

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

  // Get status text
  const getStatusText = () => {
    if (status === 'connected') return 'connected';
    if (status === 'connecting') return 'reconnecting';
    if (status === 'disconnected') return 'offline';
    if (status === 'error') return 'error';
    return status;
  };

  // Don't render anything until client-side to avoid hydration errors
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 socket-status-indicator">
      <div className="flex flex-col items-start">
        <Badge 
          className={`cursor-pointer ${getStatusColor()} flex items-center mb-1`}
          onClick={() => setShowDetails(!showDetails)}
        >
          {getStatusIcon()}
          Socket: {getStatusText()}
          {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Badge>
        
        {showDetails && (
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs mb-1 w-48">
            <div className="flex gap-1 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs flex-1"
                onClick={() => socketContext.connect()}
                disabled={status === 'connecting' || status === 'connected'}
              >
                Connect
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs flex-1"
                onClick={() => socketContext.disconnect()}
                disabled={status === 'disconnected'}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 