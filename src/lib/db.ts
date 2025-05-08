import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Import our retry-enabled Prisma client
import prismaWithRetry from './prisma-with-retry';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
};

// Cache configuration
const CACHE_TTL = 10; // 10 seconds cache TTL for better real-time data
const QUERY_CACHE_ENABLED = process.env.NODE_ENV === 'production';

/**
 * Helper function to get the appropriate database URL
 * Allows for fallback to direct URL if configured
 */
function getDatabaseUrl() {
  // In development, override with local connection
  if (process.env.NODE_ENV === 'development') {
    return 'postgresql://postgres:password@localhost:5432/jackerbox';
  }
  
  // If we have a direct database URL and need to use it for some reason, return it
  if (process.env.USE_DIRECT_URL === 'true' && process.env.DIRECT_DATABASE_URL) {
    console.log('Using direct database connection');
    return process.env.DIRECT_DATABASE_URL;
  }
  
  // Otherwise use the standard DATABASE_URL
  return process.env.DATABASE_URL;
}

// IMPORTANT: We're now using our retry-enabled Prisma client instead of creating a new one
// This ensures that all database operations will automatically retry on connection errors
export const db = prismaWithRetry;

// Handle connection close
process.on('beforeExit', async () => {
  console.log('Database connection closing...');
  try {
    await db.disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
});
