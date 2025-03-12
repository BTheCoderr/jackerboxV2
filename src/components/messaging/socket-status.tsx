"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { RefreshCw, Wifi, WifiOff, RotateCcw, Server } from "lucide-react";

interface SocketStatusProps {
  showReconnectButton?: boolean;
  showDebugInfo?: boolean;
}

export function SocketStatus({ 
  showReconnectButton = true,
  showDebugInfo = false 
}: SocketStatusProps) {
  const { 
    isConnected, 
    isPollingFallback, 
    reconnect, 
    resetConnection
  } = useSocket({ debug: showDebugInfo });
  
  const [showStatus, setShowStatus] = useState(false);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hostname, setHostname] = useState<string>('localhost');
  
  // Get the hostname when component mounts
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Show status message when connection state changes
  useEffect(() => {
    // Clear any existing timeout
    if (statusTimeout) {
      clearTimeout(statusTimeout);
    }

    // Show the status message
    setShowStatus(true);

    // Hide the status message after 5 seconds unless disconnected
    if (isConnected && !showDebugInfo) {
      const timeout = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      
      setStatusTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isConnected, isPollingFallback, showDebugInfo]);

  // Always show when disconnected, briefly show when connected or in fallback mode
  if (!showStatus && isConnected && !isPollingFallback && !showDebugInfo) {
    return null;
  }

  return (
    <div className={`rounded-md mb-2 overflow-hidden ${
      !isConnected 
        ? "bg-red-100 text-red-700 border border-red-300" 
        : isPollingFallback 
          ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
          : "bg-green-100 text-green-700 border border-green-300"
    }`}>
      <div className="flex items-center justify-between p-2">
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
          
          {showDebugInfo && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="ml-2 text-xs underline"
            >
              {expanded ? "Hide details" : "Show details"}
            </button>
          )}
        </div>
        
        <div className="flex items-center">
          {showReconnectButton && !isConnected && (
            <button
              onClick={reconnect}
              className="ml-2 p-1 bg-white rounded-md hover:bg-gray-100 text-gray-700"
              title="Reconnect"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          
          {showDebugInfo && (
            <button
              onClick={resetConnection}
              className="ml-2 p-1 bg-white rounded-md hover:bg-gray-100 text-gray-700"
              title="Reset connection"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {showDebugInfo && expanded && (
        <div className="p-2 border-t border-gray-200 text-xs bg-white bg-opacity-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Client URL:</span> 
              <span className="ml-1">http://{hostname}:3000/api/socket</span>
            </div>
            <div>
              <span className="font-medium">Socket Server:</span> 
              <span className="ml-1">http://{hostname}:3001</span>
            </div>
            <div>
              <span className="font-medium">Connection:</span> 
              <span className="ml-1">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div>
              <span className="font-medium">Transport:</span> 
              <span className="ml-1">{isPollingFallback ? "Polling (fallback)" : "WebSocket"}</span>
            </div>
          </div>
          
          <div className="mt-2 text-gray-600">
            <Server className="h-3 w-3 inline-block mr-1" />
            <span>Socket server is running on port 3001. Requests are proxied through the Next.js server on port 3000.</span>
          </div>
        </div>
      )}
    </div>
  );
} 