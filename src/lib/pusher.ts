import { io } from 'socket.io-client';

// Create Socket.io client connection (lazy initialized)
let socket: any = null;

// Maintain connection status
let isConnecting = false;
let reconnectTimer: NodeJS.Timeout | null = null;

// Get socket instance with lazy initialization
const getSocket = () => {
  if (typeof window === 'undefined') return null;
  
  if (!socket && !isConnecting) {
    isConnecting = true;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    try {
      socket = io(socketUrl, { 
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        timeout: 20000, // Increase timeout to 20s
        // Prevent multiple connections during page transitions
        forceNew: false,
        // Add optimization options
        transports: ['websocket', 'polling'],
        upgrade: true
      });
      
      socket.on('connect', () => {
        console.log('Socket connected');
        isConnecting = false;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err);
        isConnecting = false;
        
        // Only attempt reconnect if we don't already have a timer
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            if (socket) {
              socket.connect();
            }
            reconnectTimer = null;
          }, 5000);
        }
      });
      
      // Add a timeout handler
      socket.on('connect_timeout', () => {
        console.error('Socket connection timeout');
        isConnecting = false;
        
        // Clean up the socket on timeout
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      });
      
    } catch (error) {
      console.error('Error initializing socket:', error);
      isConnecting = false;
      socket = null;
    }
  }
  
  return socket;
};

// Server-side socket emitter - to be used only in API routes
// This is a simple compatibility layer for the existing Pusher code
export const pusherServer = {
  trigger: async (channelName: string, event: string, data: any) => {
    try {
      // In server context, we'll use the socket.io server path in the API
      const serverApiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/socket/emit`;
      
      const response = await fetch(serverApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channelName,
          event,
          data
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to emit socket event');
      }
      
      return true;
    } catch (error) {
      console.error('Error in pusherServer.trigger:', error);
      return false;
    }
  }
};

// Client-side socket connection wrapper
export const pusherClient = {
  subscribe: (channelName: string) => {
    try {
      const socket = getSocket();
      if (!socket) return { bind: () => {}, unbind: () => {} };
      
      // Join the channel room
      socket.emit('join', channelName);
      
      return {
        bind: (event: string, callback: (data: any) => void) => {
          // Create a namespaced event for this channel
          const fullEventName = `${channelName}:${event}`;
          socket.on(fullEventName, callback);
          return () => socket.off(fullEventName, callback);
        },
        unbind: (event?: string) => {
          if (event) {
            socket.off(`${channelName}:${event}`);
          }
        }
      };
    } catch (error) {
      console.error('Error in pusherClient.subscribe:', error);
      return { bind: () => {}, unbind: () => {} };
    }
  }
};

// Wrapper for client-side subscribing to channels
export function createPusherChannel(channelName: string) {
  return pusherClient.subscribe(channelName);
}

// Helper to generate consistent channel names
export function getConversationChannelName(conversationId: string) {
  return `conversation-${conversationId}`;
}

export function getUserChannelName(userId: string) {
  return `user-${userId}`;
} 