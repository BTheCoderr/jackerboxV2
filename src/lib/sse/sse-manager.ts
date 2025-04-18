/**
 * Server-Sent Events (SSE) Manager
 * 
 * This module provides a simple pub/sub system for real-time communication
 * using Server-Sent Events (SSE), which is more compatible with Next.js
 * than WebSockets and doesn't require a separate server.
 */

import { v4 as uuidv4 } from 'uuid';

// Client type
export interface SSEClient {
  id: string;
  userId?: string;
  controller: ReadableStreamDefaultController;
  topics: Set<string>;
  lastActivity: number;
  encoder: TextEncoder;
}

// Global state
let clients: Map<string, SSEClient> = new Map();
let topics: Map<string, Set<string>> = new Map();
let debugMode = process.env.NODE_ENV === 'development';
let totalConnections = 0;
const MAX_CLIENTS_PER_USER = 3;
const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL = 60000; // Increase heartbeat interval to 60 seconds (from 30)

/**
 * Toggle debug mode
 */
export function toggleDebugMode(enabled: boolean): boolean {
  debugMode = enabled;
  if (debugMode) {
    console.log(`SSE debug mode enabled. Active clients: ${clients.size}`);
  }
  return debugMode;
}

/**
 * Get debug mode status
 */
export function getDebugMode(): boolean {
  return debugMode;
}

/**
 * Create a new SSE connection
 */
export function createSSEConnection(userId?: string): ReadableStream {
  try {
    // Clean up inactive clients first
    cleanupInactiveClients();
    
    // Create a new client ID
    const clientId = `client-${uuidv4()}`;
    const encoder = new TextEncoder();
    
    // Create the SSE stream
    return new ReadableStream({
      start(controller) {
        try {
          // Register the client
          clients.set(clientId, {
            id: clientId,
            userId,
            controller,
            topics: new Set(),
            lastActivity: Date.now(),
            encoder,
          });
          
          // Increment total connections
          totalConnections++;
          
          if (debugMode) {
            console.log(`New client connected: ${clientId}. Total connections: ${totalConnections}`);
          }
          
          // Send initial connection message
          const initialMessage = JSON.stringify({ 
            type: 'connected', 
            clientId,
            timestamp: Date.now()
          });
          controller.enqueue(encoder.encode(`data: ${initialMessage}\n\n`));
          
          // Set up heartbeat with error handling
          const heartbeatInterval = setInterval(() => {
            try {
              const client = clients.get(clientId);
              if (client && !client.controller.desiredSize) {
                const heartbeat = JSON.stringify({ 
                  type: 'heartbeat',
                  timestamp: Date.now()
                });
                client.controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
                client.lastActivity = Date.now();
              } else {
                clearInterval(heartbeatInterval);
                removeClient(clientId);
              }
            } catch (err) {
              console.error(`Heartbeat error for client ${clientId}:`, err);
              clearInterval(heartbeatInterval);
              removeClient(clientId);
            }
          }, HEARTBEAT_INTERVAL);
          
          // Clean up on stream end
          return () => {
            try {
              clearInterval(heartbeatInterval);
              removeClient(clientId);
              if (debugMode) {
                console.log(`Stream ended for client ${clientId}`);
              }
            } catch (err) {
              console.error(`Error cleaning up client ${clientId}:`, err);
            }
          };
        } catch (err) {
          console.error('Error in SSE stream start:', err);
          controller.error(err);
        }
      },
      
      cancel() {
        try {
          removeClient(clientId);
          if (debugMode) {
            console.log(`Stream cancelled for client ${clientId}`);
          }
        } catch (err) {
          console.error(`Error cancelling stream for client ${clientId}:`, err);
        }
      }
    });
  } catch (err) {
    console.error('Error creating SSE connection:', err);
    throw err;
  }
}

/**
 * Remove a client
 */
export function removeClient(clientId: string): boolean {
  try {
    if (!clients.has(clientId)) {
      return false;
    }
    
    const client = clients.get(clientId)!;
    
    // Unsubscribe from all topics
    for (const topic of client.topics) {
      if (topics.has(topic)) {
        const subscribers = topics.get(topic)!;
        subscribers.delete(clientId);
        
        if (subscribers.size === 0) {
          topics.delete(topic);
        }
      }
    }
    
    // Remove the client
    clients.delete(clientId);
    
    if (debugMode) {
      console.log(`Client ${clientId} disconnected. Active clients: ${clients.size}`);
    }
    
    return true;
  } catch (err) {
    console.error('Error removing client:', err);
    return false;
  }
}

/**
 * Subscribe a client to a topic
 */
export function subscribe(clientId: string, topic: string): boolean {
  try {
    if (!clients.has(clientId)) {
      if (debugMode) {
        console.log(`Cannot subscribe: Client ${clientId} not found`);
      }
      return false;
    }
    
    const client = clients.get(clientId)!;
    client.lastActivity = Date.now();
    
    // Add the topic to the client
    client.topics.add(topic);
    
    // Add the client to the topic
    if (!topics.has(topic)) {
      topics.set(topic, new Set());
    }
    
    topics.get(topic)!.add(clientId);
    
    // Send the subscription confirmation
    sendToClient(clientId, {
      type: 'subscribed',
      topic,
    });
    
    return true;
  } catch (err) {
    console.error('Error subscribing to topic:', err);
    return false;
  }
}

/**
 * Unsubscribe a client from a topic
 */
export function unsubscribe(clientId: string, topic: string): boolean {
  try {
    if (!clients.has(clientId)) {
      return false;
    }
    
    const client = clients.get(clientId)!;
    client.lastActivity = Date.now();
    
    // Remove the topic from the client
    client.topics.delete(topic);
    
    // Remove the client from the topic
    if (topics.has(topic)) {
      const subscribers = topics.get(topic)!;
      subscribers.delete(clientId);
      
      if (subscribers.size === 0) {
        topics.delete(topic);
      }
    }
    
    // Send the unsubscription confirmation
    sendToClient(clientId, {
      type: 'unsubscribed',
      topic,
    });
    
    return true;
  } catch (err) {
    console.error('Error unsubscribing from topic:', err);
    return false;
  }
}

/**
 * Publish a message to a topic
 */
export function publish(topic: string, data: any): number {
  try {
    if (!topics.has(topic)) {
      return 0;
    }
    
    const subscribers = topics.get(topic)!;
    let sentCount = 0;
    
    // Send the message to all subscribers
    for (const clientId of subscribers) {
      if (sendToClient(clientId, {
        type: 'message',
        topic,
        data,
        timestamp: Date.now(),
      })) {
        sentCount++;
      }
    }
    
    return sentCount;
  } catch (err) {
    console.error('Error publishing message:', err);
    return 0;
  }
}

/**
 * Send a message to a specific client
 */
export function sendToClient(clientId: string, message: any): boolean {
  try {
    if (!clients.has(clientId)) {
      return false;
    }
    
    const client = clients.get(clientId)!;
    client.lastActivity = Date.now();
    
    // Encode and send the message
    const encodedMessage = client.encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
    client.controller.enqueue(encodedMessage);
    
    return true;
  } catch (err) {
    console.error('Error sending message to client:', err);
    
    // Remove the client if there was an error
    removeClient(clientId);
    return false;
  }
}

/**
 * Send a message to a specific user
 */
export function sendToUser(userId: string, message: any): number {
  try {
    if (!userId) {
      return 0;
    }
    
    let sentCount = 0;
    
    // Find all clients for the user
    for (const client of clients.values()) {
      if (client.userId === userId) {
        if (sendToClient(client.id, message)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  } catch (err) {
    console.error('Error sending message to user:', err);
    return 0;
  }
}

/**
 * Get SSE stats
 */
export function getStats(): any {
  try {
    return {
      clientCount: clients.size,
      topicCount: topics.size,
      totalConnections,
      topics: Array.from(topics.keys()),
      debugMode,
    };
  } catch (err) {
    console.error('Error getting SSE stats:', err);
    return {
      error: 'Failed to get stats',
    };
  }
}

/**
 * Clean up inactive clients
 */
export function cleanupInactiveClients(): number {
  try {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [clientId, client] of clients.entries()) {
      if (now - client.lastActivity > INACTIVE_TIMEOUT) {
        if (removeClient(clientId)) {
          removedCount++;
        }
      }
    }
    
    if (removedCount > 0 && debugMode) {
      console.log(`Cleaned up ${removedCount} inactive SSE clients`);
    }
    
    return removedCount;
  } catch (err) {
    console.error('Error cleaning up inactive clients:', err);
    return 0;
  }
} 