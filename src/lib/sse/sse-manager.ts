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
    
    // If userId is provided, check if we need to limit connections
    if (userId) {
      const userClients = Array.from(clients.values()).filter(client => client.userId === userId);
      
      // If user has too many connections, close the oldest one
      if (userClients.length >= MAX_CLIENTS_PER_USER) {
        const oldestClient = userClients.sort((a, b) => a.lastActivity - b.lastActivity)[0];
        
        if (oldestClient) {
          try {
            if (debugMode) {
              console.log(`Closing oldest connection for user ${userId}: ${oldestClient.id}`);
            }
            
            // Send a close message to the client
            sendToClient(oldestClient.id, {
              type: 'close',
              reason: 'Too many connections',
            });
            
            // Remove the client
            removeClient(oldestClient.id);
          } catch (err) {
            console.error('Error closing oldest client connection:', err);
          }
        }
      }
    }
    
    // Create a new client ID
    const clientId = `client-${uuidv4()}`;
    const encoder = new TextEncoder();
    
    // Create the SSE stream
    const stream = new ReadableStream({
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
          
          totalConnections++;
          
          if (debugMode) {
            console.log(`SSE connections: ${clients.size} active (${totalConnections} total)`);
          }
          
          // Send the connection message
          const connectionMessage = {
            type: 'connection',
            clientId,
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectionMessage)}\n\n`));
          
          // Start the heartbeat
          const heartbeatInterval = setInterval(() => {
            try {
              if (clients.has(clientId)) {
                const client = clients.get(clientId)!;
                client.lastActivity = Date.now();
                
                const heartbeatMessage = {
                  type: 'heartbeat',
                  timestamp: Date.now(),
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeatMessage)}\n\n`));
              } else {
                clearInterval(heartbeatInterval);
              }
            } catch (err) {
              console.error('Error sending heartbeat:', err);
              clearInterval(heartbeatInterval);
            }
          }, 30000); // Send heartbeat every 30 seconds
        } catch (err) {
          console.error('Error starting SSE stream:', err);
          controller.error(err);
        }
      },
      
      cancel() {
        try {
          // Remove the client when the connection is closed
          removeClient(clientId);
        } catch (err) {
          console.error('Error canceling SSE stream:', err);
        }
      },
    });
    
    return stream;
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