import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

/**
 * Creates a Redis adapter for Socket.IO to enable multi-instance support in serverless environments.
 * This is particularly useful for Vercel deployments where each function is isolated.
 * 
 * Note: This requires a Redis instance to be configured with the following environment variables:
 * - REDIS_URL: The URL of the Redis instance
 * 
 * If Redis is not configured, this will return null and Socket.IO will use the default in-memory adapter.
 */
export function createVercelAdapter(io: SocketIOServer): void {
  try {
    // Check if Redis URL is configured
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('Redis URL not configured, using default in-memory adapter');
      return;
    }
    
    // Create Redis clients for pub/sub
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    
    // Handle connection errors
    pubClient.on('error', (err) => {
      console.error('Redis pub client error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis sub client error:', err);
    });
    
    // Create and set the Redis adapter
    const redisAdapter = createAdapter(pubClient, subClient);
    io.adapter(redisAdapter);
    
    console.log('Redis adapter configured for Socket.IO');
  } catch (error) {
    console.error('Error configuring Redis adapter:', error);
    console.log('Falling back to default in-memory adapter');
  }
}

/**
 * Configures Socket.IO for optimal performance in serverless environments like Vercel.
 */
export function configureForServerless(io: SocketIOServer): void {
  // Set up serverless-friendly options
  // Disable server-side emit in serverless environments
  // @ts-ignore - TypeScript doesn't recognize this property but it exists in Socket.IO
  io.serverSideEmit = false;
  
  // Configure the adapter if possible
  createVercelAdapter(io);
  
  // Log adapter type
  console.log(`Socket.IO adapter: ${io.adapter.constructor.name}`);
} 