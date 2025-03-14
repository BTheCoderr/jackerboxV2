"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useSocketStatus } from '@/components/providers/SocketStatusProvider';

export function SocketStatusIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const { status, isConnected, isReconnecting, isOffline, connect, disconnect } = useSocketStatus();
  const [mounted, setMounted] = useState(false);

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

  // Get status color
  const getStatusColor = () => {
    if (!mounted) return 'bg-gray-500 hover:bg-gray-600'; // Default color for server rendering
    if (isConnected) return 'bg-green-500 hover:bg-green-600';
    if (isReconnecting) return 'bg-yellow-500 hover:bg-yellow-600';
    if (isOffline) return 'bg-red-500 hover:bg-red-600';
    return 'bg-gray-500 hover:bg-gray-600';
  };

  // Get status icon - use AlertCircle for server rendering to prevent hydration mismatch
  const getStatusIcon = () => {
    if (!mounted) return <AlertCircle className="h-4 w-4 mr-1" />; // Default icon for server rendering
    if (isConnected) return <Wifi className="h-4 w-4 mr-1" />;
    if (isReconnecting) return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    if (isOffline) return <WifiOff className="h-4 w-4 mr-1" />;
    return <AlertCircle className="h-4 w-4 mr-1" />;
  };

  // Get status text
  const getStatusText = () => {
    if (!mounted) return 'connecting...'; // Default text for server rendering
    if (isConnected) return 'connected';
    if (isReconnecting) return 'reconnecting';
    if (isOffline) return 'offline';
    return status;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 socket-status-indicator">
      <Badge 
        className={`cursor-pointer ${getStatusColor()} flex items-center`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        Socket: {getStatusText()}
      </Badge>
      
      {mounted && showDetails && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-64">
          <div className="flex flex-col space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Status:</span> {getStatusText()}
            </div>
            
            <div className="text-sm">
              <span className="font-semibold">Network:</span> {navigator.onLine ? 'online' : 'offline'}
            </div>
            
            <div className="flex space-x-2 mt-2">
              {isConnected ? (
                <Button size="sm" onClick={disconnect} variant="destructive">
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={connect} variant="default">
                  Connect
                </Button>
              )}
            </div>
            
            {isOffline && (
              <div className="text-xs text-red-500 mt-1">
                You are currently offline. Messages will be sent when your connection is restored.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 