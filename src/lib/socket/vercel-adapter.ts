import { Server as SocketIOServer } from 'socket.io';

/**
 * Configures Socket.IO for optimal performance in serverless environments like Vercel.
 * 
 * This is a simplified version that doesn't rely on Redis adapter to avoid build errors.
 * In a production environment, you might want to add Redis adapter support for multi-instance deployments.
 */
export async function configureForServerless(io: SocketIOServer): Promise<void> {
  try {
    console.log('Configuring Socket.IO for serverless environment');
    
    // Set up serverless-friendly options
    // @ts-ignore - TypeScript doesn't recognize this property but it exists in Socket.IO
    io.serverSideEmit = false;
    
    // Configure additional options for better performance in serverless environments
    io.engine.opts.pingInterval = 60000; // 60 seconds
    io.engine.opts.pingTimeout = 30000; // 30 seconds
    
    // Log configuration
    console.log('Socket.IO configured for serverless environment');
    console.log(`Socket.IO adapter: ${io.adapter.constructor.name}`);
    console.log(`Socket.IO transports: ${io.engine.opts.transports?.join(', ')}`);
  } catch (error) {
    console.error('Error configuring Socket.IO for serverless:', error);
  }
} 