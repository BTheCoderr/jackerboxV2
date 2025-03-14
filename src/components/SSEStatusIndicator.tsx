'use client';

import { useSSE } from '@/hooks/use-sse';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff, Wifi, AlertCircle, Bug } from 'lucide-react';

export function SSEStatusIndicator() {
  const [messages, setMessages] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state after initial render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use refs to prevent infinite updates
  const messageHandledRef = useRef(new Set<string>());
  
  // Message handler with deduplication
  const handleMessage = useCallback((data: any) => {
    // Create a unique ID for the message to prevent duplicates
    const messageId = JSON.stringify(data) + Date.now();
    
    // Skip if we've already handled this message
    if (messageHandledRef.current.has(messageId)) {
      return;
    }
    
    // Mark as handled
    messageHandledRef.current.add(messageId);
    
    // Limit the size of the handled set to prevent memory leaks
    if (messageHandledRef.current.size > 100) {
      const entries = Array.from(messageHandledRef.current);
      messageHandledRef.current = new Set(entries.slice(-50));
    }
    
    // Update messages state
    setMessages(prev => [...prev.slice(-9), data]);
  }, []);
  
  const {
    status,
    clientId,
    error,
    subscribedTopics,
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    getStats,
  } = useSSE({
    onConnect: (id) => {
      console.log('SSE connected with client ID:', id);
      // Auto-subscribe to a test topic
      subscribe('test');
    },
    onMessage: handleMessage,
    onSubscribed: (topic) => {
      console.log('Subscribed to topic:', topic);
    },
    onUnsubscribed: (topic) => {
      console.log('Unsubscribed from topic:', topic);
    },
    onError: (err) => {
      console.error('SSE error:', err);
    },
    onReconnect: () => {
      console.log('Attempting to reconnect SSE...');
    },
  });

  // Toggle debug mode
  const toggleDebugMode = useCallback(async () => {
    try {
      const newDebugMode = !debugMode;
      const response = await fetch('/api/sse/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: newDebugMode,
        }),
      });
      
      if (response.ok) {
        setDebugMode(newDebugMode);
        console.log(`SSE debug mode ${newDebugMode ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      console.error('Error toggling debug mode:', err);
    }
  }, [debugMode]);
  
  // Status badge color
  const getStatusColor = useCallback(() => {
    if (!mounted) return 'bg-gray-500 hover:bg-gray-600'; // Default color for server rendering
    
    switch (status) {
      case 'connected':
        return 'bg-green-500 hover:bg-green-600';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'disconnected':
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }, [status, mounted]);
  
  // Status icon
  const getStatusIcon = useCallback(() => {
    if (!mounted) return <AlertCircle className="h-4 w-4 mr-1" />; // Default icon for server rendering
    
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 mr-1" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 mr-1" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  }, [status, mounted]);
  
  // Send a test message
  const sendTestMessage = useCallback(async () => {
    try {
      const response = await fetch('/api/sse/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'test',
          data: {
            text: 'Test message',
            timestamp: new Date().toISOString(),
          },
        }),
      });
      
      const result = await response.json();
      console.log('Test message sent:', result);
    } catch (err) {
      console.error('Error sending test message:', err);
    }
  }, []);

  // Get SSE stats
  const fetchStats = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const stats = await getStats();
      setStats(stats);
      console.log('SSE stats:', stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [clientId, getStats]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        className={`cursor-pointer ${getStatusColor()} flex items-center`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        SSE: {!mounted ? 'connecting...' : status}
      </Badge>
      
      {mounted && showDetails && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-80">
          <div className="flex flex-col space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Status:</span> {status}
            </div>
            {clientId && (
              <div className="text-sm">
                <span className="font-semibold">Client ID:</span> 
                <span className="text-xs">{clientId}</span>
              </div>
            )}
            {subscribedTopics.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Subscribed topics:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {subscribedTopics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500">
                <span className="font-semibold">Error:</span> {error.message}
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Button 
                size="sm" 
                variant={debugMode ? "default" : "outline"} 
                onClick={toggleDebugMode}
                className="flex items-center"
              >
                <Bug className="h-3 w-3 mr-1" />
                Debug Mode: {debugMode ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex space-x-2 mt-2">
              {status === 'disconnected' || status === 'error' ? (
                <Button size="sm" onClick={connect} variant="default">
                  Connect
                </Button>
              ) : (
                <Button size="sm" onClick={disconnect} variant="destructive">
                  Disconnect
                </Button>
              )}
              
              <Button size="sm" onClick={reconnect} variant="outline" disabled={status === 'disconnected'}>
                Reconnect
              </Button>
              
              <Button size="sm" onClick={sendTestMessage} variant="outline" disabled={status !== 'connected'}>
                Test
              </Button>
              
              <Button size="sm" onClick={fetchStats} variant="outline" disabled={!clientId}>
                Stats
              </Button>
            </div>
            
            {stats && (
              <div className="mt-2 text-xs">
                <div className="font-semibold">Stats:</div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">
                  <div>Clients: {stats.clientCount}</div>
                  <div>Topics: {stats.topicCount}</div>
                  <div>Total connections: {stats.totalConnections}</div>
                </div>
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold text-sm">Recent messages:</div>
                <div className="mt-1 max-h-32 overflow-y-auto text-xs">
                  {messages.map((msg, i) => (
                    <div key={i} className="p-1 border-b border-gray-200 dark:border-gray-700">
                      {JSON.stringify(msg)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 