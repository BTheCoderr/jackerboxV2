"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { SocketStatus } from "@/components/messaging/socket-status";

export default function SocketDebugPage() {
  const { 
    socket, 
    isConnected, 
    isPollingFallback, 
    reconnect,
    resetConnection,
    subscribe
  } = useSocket({ debug: true });
  
  const [events, setEvents] = useState<Array<{
    type: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  
  const [socketInfo, setSocketInfo] = useState<{
    id: string | null;
    transport: string | null;
  }>({
    id: null,
    transport: null
  });
  
  const [hostname, setHostname] = useState<string>('localhost');
  
  // Get the hostname when component mounts
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);
  
  // Log socket events
  useEffect(() => {
    if (!socket) return;
    
    // Log connection events
    const onConnect = () => {
      addEvent('connect');
      updateSocketInfo();
    };
    
    const onDisconnect = (reason: string) => {
      addEvent('disconnect', { reason });
      setSocketInfo({
        id: null,
        transport: null
      });
    };
    
    const onConnectError = (error: Error) => {
      addEvent('connect_error', { message: error.message });
    };
    
    const onReconnect = (attempt: number) => {
      addEvent('reconnect', { attempt });
      updateSocketInfo();
    };
    
    const onReconnectAttempt = (attempt: number) => {
      addEvent('reconnect_attempt', { attempt });
    };
    
    const onReconnectError = (error: Error) => {
      addEvent('reconnect_error', { message: error.message });
    };
    
    const onReconnectFailed = () => {
      addEvent('reconnect_failed');
    };
    
    // Subscribe to events
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect', onReconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect_error', onReconnectError);
    socket.io.on('reconnect_failed', onReconnectFailed);
    
    // Update socket info if already connected
    if (socket.connected) {
      updateSocketInfo();
    }
    
    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect', onReconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect_error', onReconnectError);
      socket.io.off('reconnect_failed', onReconnectFailed);
    };
  }, [socket]);
  
  // Add an event to the log
  const addEvent = (type: string, data?: any) => {
    setEvents(prev => [
      {
        type,
        data,
        timestamp: new Date()
      },
      ...prev.slice(0, 49) // Keep only the last 50 events
    ]);
  };
  
  // Update socket info
  const updateSocketInfo = () => {
    if (!socket) return;
    
    setSocketInfo({
      id: socket.id || null,
      transport: socket.io.engine?.transport?.name || null
    });
  };
  
  // Clear events
  const clearEvents = () => {
    setEvents([]);
  };
  
  // Check socket server status
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/socket-status');
      const data = await response.json();
      addEvent('status_check', data);
    } catch (error: any) {
      addEvent('status_check_error', { message: error.message });
    }
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Socket Server Debug</h1>
      
      <div className="mb-6">
        <SocketStatus showDebugInfo={true} />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Connection Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="font-medium text-gray-700 mb-2">Client Configuration</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Next.js Server:</span> 
                <span className="ml-1">http://{hostname}:3000</span>
              </div>
              <div>
                <span className="font-medium">Socket.IO Path:</span> 
                <span className="ml-1">/api/socket</span>
              </div>
              <div>
                <span className="font-medium">Primary Transport:</span> 
                <span className="ml-1">WebSocket</span>
              </div>
              <div>
                <span className="font-medium">Fallback Transport:</span> 
                <span className="ml-1">Polling</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="font-medium text-gray-700 mb-2">Socket Server</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Connection Method:</span> 
                <span className="ml-1">Proxy Route</span>
              </div>
              <div>
                <span className="font-medium">Client URL:</span> 
                <span className="ml-1">http://{hostname}:3000/api/socket</span>
              </div>
              <div>
                <span className="font-medium">Socket Server:</span> 
                <span className="ml-1">http://{hostname}:3001</span>
              </div>
              <div>
                <span className="font-medium">Connection Status:</span> 
                <span className={`ml-1 ${isConnected ? "text-green-600" : "text-red-600"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div>
                <span className="font-medium">Transport Mode:</span> 
                <span className={`ml-1 ${isPollingFallback ? "text-yellow-600" : "text-green-600"}`}>
                  {isPollingFallback ? "Polling (fallback)" : "WebSocket"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Socket Details</h3>
          <div className="bg-gray-50 p-3 rounded border text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Socket ID:</span> 
                <span className="ml-1">{socketInfo.id || "Not connected"}</span>
              </div>
              <div>
                <span className="font-medium">Active Transport:</span> 
                <span className="ml-1">{socketInfo.transport || "None"}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-x-2">
          <button 
            onClick={reconnect}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reconnect
          </button>
          
          <button 
            onClick={resetConnection}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Reset Connection
          </button>
          
          <button 
            onClick={checkStatus}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Check Server Status
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Event Log</h2>
          <button 
            onClick={clearEvents}
            className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
        
        <div className="h-96 overflow-y-auto border rounded p-2 bg-gray-50">
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No events yet</div>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className={`p-2 rounded ${
                  event.type.includes('error') || event.type.includes('failed')
                    ? 'bg-red-100'
                    : event.type === 'connect' || event.type === 'reconnect'
                      ? 'bg-green-100'
                      : event.type.includes('attempt')
                        ? 'bg-yellow-100'
                        : 'bg-gray-100'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-gray-500">{formatTime(event.timestamp)}</span>
                  </div>
                  {event.data && (
                    <pre className="text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-3 rounded border">
        <h3 className="font-semibold text-blue-700 mb-2">Troubleshooting Tips</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>The socket server runs on port 3001, separate from the Next.js server on port 3000.</li>
          <li>If you see WebSocket connection errors, make sure the socket server is running.</li>
          <li>You can check the socket server status with the "Check Server Status" button.</li>
          <li>The proxy route at /api/socket redirects requests to the socket server.</li>
          <li>If you're still having issues, try the "Reset Connection" button.</li>
        </ul>
      </div>
    </div>
  );
} 