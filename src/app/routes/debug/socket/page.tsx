"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { SocketStatus } from '@/components/messaging/socket-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Server, Terminal, Wifi, WifiOff } from 'lucide-react';

// Simple tabs implementation
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface TabsListProps {
  children: React.ReactNode;
}

const TabsList: React.FC<TabsListProps> = ({ children }) => {
  return <div className="flex space-x-2 border-b mb-4">{children}</div>;
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '', onClick }) => {
  return (
    <button
      className={`px-4 py-2 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  show: boolean;
}

const TabsContent: React.FC<TabsContentProps> = ({ children, show, className = '' }) => {
  if (!show) return null;
  return <div className={className}>{children}</div>;
};

interface SocketServerStatus {
  initialized: boolean;
  initializing: boolean;
  port: number | null;
  error: string | null;
  socketServerUrl: string | null;
  proxyUrl: string;
  timestamp: string;
}

export default function SocketDebugPage() {
  const { socket, status, error, connect, disconnect } = useSocket();
  const [serverStatus, setServerStatus] = useState<SocketServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: string }>>([]);
  const [activeTab, setActiveTab] = useState('status');

  // Fetch the socket server status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/socket-status');
      const data = await response.json();
      setServerStatus(data);
    } catch (err) {
      console.error('Error fetching socket server status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for socket events
  useEffect(() => {
    if (socket && status === 'connected') {
      // Add a connected event
      setEvents(prev => [
        {
          type: 'connect',
          data: { id: socket.id, transport: socket.io.engine.transport.name },
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      // Listen for all events
      const onAnyEvent = (event: string, ...args: any[]) => {
        setEvents(prev => [
          {
            type: event,
            data: args.length === 1 ? args[0] : args,
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
      };

      // Listen for transport changes
      const onTransportChange = (transport: any) => {
        setEvents(prev => [
          {
            type: 'transport',
            data: { name: transport.name },
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
      };

      // Listen for disconnect
      const onDisconnect = (reason: string) => {
        setEvents(prev => [
          {
            type: 'disconnect',
            data: { reason },
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
      };

      // Add event listeners
      socket.onAny(onAnyEvent);
      socket.io.engine.on('upgrade', onTransportChange);
      socket.on('disconnect', onDisconnect);

      // Clean up
      return () => {
        socket.offAny(onAnyEvent);
        socket.off('disconnect', onDisconnect);
      };
    }
  }, [socket, status]);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get the connection status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500">Connecting</Badge>;
      case 'disconnected':
        return <Badge className="bg-gray-500">Disconnected</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  // Get the server status badge
  const getServerStatusBadge = () => {
    if (!serverStatus) return <Badge className="bg-gray-500">Unknown</Badge>;
    
    if (serverStatus.initialized) {
      return <Badge className="bg-green-500">Running</Badge>;
    } else if (serverStatus.initializing) {
      return <Badge className="bg-yellow-500">Initializing</Badge>;
    } else if (serverStatus.error) {
      return <Badge className="bg-red-500">Error</Badge>;
    } else {
      return <Badge className="bg-gray-500">Not Running</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Socket Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="h-5 w-5 mr-2" />
              Client Connection
              <div className="ml-auto">{getStatusBadge()}</div>
            </CardTitle>
            <CardDescription>
              Socket.IO client connection status and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <SocketStatus />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Socket ID:</span>{' '}
                  <span className="font-mono">{socket?.id || 'Not connected'}</span>
                </div>
                <div>
                  <span className="font-medium">Transport:</span>{' '}
                  <span>{socket?.io.engine.transport.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Connected:</span>{' '}
                  <span>{status === 'connected' ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-medium">Proxy URL:</span>{' '}
                  <span className="font-mono">{serverStatus?.proxyUrl || '/api/socket'}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {status !== 'connected' && (
              <Button onClick={connect}>
                Connect
              </Button>
            )}
            {status === 'connected' && (
              <Button variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Socket Server
              <div className="ml-auto">{getServerStatusBadge()}</div>
            </CardTitle>
            <CardDescription>
              Socket.IO server status and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading server status...</span>
              </div>
            ) : serverStatus ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span>
                      {serverStatus.initialized
                        ? 'Running'
                        : serverStatus.initializing
                        ? 'Initializing'
                        : 'Not Running'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Port:</span>{' '}
                    <span className="font-mono">{serverStatus.port || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Server URL:</span>{' '}
                    <span className="font-mono">{serverStatus.socketServerUrl || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Proxy URL:</span>{' '}
                    <span className="font-mono">{serverStatus.proxyUrl}</span>
                  </div>
                </div>
                
                {serverStatus.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    <div className="font-medium">Error:</div>
                    <div className="font-mono text-xs">{serverStatus.error}</div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(serverStatus.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Failed to load server status
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div>
        <div className="flex space-x-2 border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'status' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('status')}
          >
            Connection Status
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'events' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('events')}
          >
            Events Log
          </button>
        </div>
        
        {activeTab === 'status' && (
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
              <CardDescription>
                Detailed information about the socket connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'connected' && socket ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Socket ID:</span>{' '}
                      <span className="font-mono">{socket.id}</span>
                    </div>
                    <div>
                      <span className="font-medium">Transport:</span>{' '}
                      <span>{socket.io.engine.transport.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Protocol:</span>{' '}
                      <span>{(socket.io.engine as any).protocol || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Connected:</span>{' '}
                      <span>{socket.connected ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Namespace:</span>{' '}
                      <span>{'/'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Query:</span>{' '}
                      <span className="font-mono">{JSON.stringify(socket.io.opts.query || {})}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Socket Options:</h3>
                    <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-40">
                      {JSON.stringify(socket.io.opts, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <WifiOff className="h-12 w-12 mb-4" />
                  <p>Socket is not connected</p>
                  {status === 'error' && error && (
                    <p className="text-red-500 mt-2">Error: {error.message}</p>
                  )}
                  <Button className="mt-4" onClick={connect}>
                    Connect Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'events' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="h-5 w-5 mr-2" />
                Events Log
              </CardTitle>
              <CardDescription>
                Log of socket events received from the server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {events.map((event, index) => (
                    <div key={index} className="p-2 border rounded-md text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{event.type}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="bg-gray-100 p-2 rounded-md text-xs mt-1 overflow-auto max-h-20">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No events received yet
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setEvents([])}>
                Clear Events
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 