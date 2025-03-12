"use client";

import { useSocket } from '@/hooks/use-socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function SocketStatus() {
  const { socket, status, error, connect, disconnect } = useSocket();
  const [transport, setTransport] = useState<string>('');

  useEffect(() => {
    if (socket && status === 'connected') {
      // Get the current transport
      const currentTransport = socket.io.engine.transport.name;
      setTransport(currentTransport);

      // Listen for transport changes
      socket.io.engine.on('upgrade', (transport: any) => {
        setTransport(transport.name);
      });
    } else {
      setTransport('');
    }
  }, [socket, status]);

  // Get the appropriate status color
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get the appropriate transport badge
  const getTransportBadge = () => {
    if (!transport) return null;

    return (
      <Badge variant={transport === 'websocket' ? 'default' : 'secondary'} className="ml-2">
        {transport}
      </Badge>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />
        <span className="text-xs font-medium">
          {status === 'connecting' && (
            <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" />
          )}
          Socket: {status}
        </span>
        {getTransportBadge()}
      </div>
      
      {status === 'disconnected' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-6 px-2"
          onClick={connect}
        >
          Connect
        </Button>
      )}
      
      {status === 'connected' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-6 px-2"
          onClick={disconnect}
        >
          Disconnect
        </Button>
      )}
      
      {status === 'error' && error && (
        <span className="text-xs text-red-500" title={error.message}>
          Error: {error.message.substring(0, 20)}...
        </span>
      )}
    </div>
  );
} 