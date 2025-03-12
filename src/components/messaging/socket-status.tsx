"use client";

import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";

export function SocketStatus() {
  const { isConnected, isPollingFallback, reconnect } = useSocket({ debug: false });
  const [showStatus, setShowStatus] = useState(false);

  // Show status message when connection changes
  useEffect(() => {
    if (!isConnected) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (!showStatus && isConnected) return null;

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-md shadow-md transition-opacity duration-300 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {!isConnected ? (
        <div className="flex items-center space-x-2">
          <span className="animate-pulse">●</span>
          <span>You're currently offline. Messages will be sent when your connection is restored.</span>
          <button 
            onClick={() => reconnect()} 
            className="ml-2 px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300 text-xs"
          >
            Reconnect
          </button>
        </div>
      ) : isPollingFallback ? (
        <div className="flex items-center space-x-2">
          <span>●</span>
          <span>Connected using fallback mode. Some features may be slower.</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span>●</span>
          <span>Connected</span>
        </div>
      )}
    </div>
  );
} 