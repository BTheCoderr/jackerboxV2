"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

interface SocketStatusProps {
  showReconnectButton?: boolean;
}

export function SocketStatus({ showReconnectButton = true }: SocketStatusProps) {
  const { isConnected, isPollingFallback, reconnect } = useSocket();
  const [showStatus, setShowStatus] = useState(false);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);

  // Show status message when connection state changes
  useEffect(() => {
    // Clear any existing timeout
    if (statusTimeout) {
      clearTimeout(statusTimeout);
    }

    // Show the status message
    setShowStatus(true);

    // Hide the status message after 5 seconds unless disconnected
    if (isConnected) {
      const timeout = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      
      setStatusTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isConnected, isPollingFallback]);

  // Always show when disconnected, briefly show when connected or in fallback mode
  if (!showStatus && isConnected && !isPollingFallback) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-2 text-sm rounded-md mb-2 ${
      !isConnected 
        ? "bg-red-100 text-red-700" 
        : isPollingFallback 
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
    }`}>
      <div className="flex items-center">
        {!isConnected ? (
          <>
            <WifiOff className="h-4 w-4 mr-2" />
            <span>You're currently offline. Messages will be sent when your connection is restored.</span>
          </>
        ) : isPollingFallback ? (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            <span>Using fallback mode. Some features may be limited.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            <span>Connected</span>
          </>
        )}
      </div>
      
      {showReconnectButton && !isConnected && (
        <button
          onClick={reconnect}
          className="ml-2 p-1 bg-white rounded-md hover:bg-gray-100 text-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 