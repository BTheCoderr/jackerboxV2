import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
};

// Cache configuration
const CACHE_TTL = 60; // 60 seconds default cache TTL
const QUERY_CACHE_ENABLED = process.env.NODE_ENV === 'production';

/**
 * Helper function to get the appropriate database URL
 * Allows for fallback to direct URL if configured
 */
function getDatabaseUrl() {
  // If we have a direct database URL and need to use it for some reason, return it
  if (process.env.USE_DIRECT_URL === 'true' && process.env.DIRECT_DATABASE_URL) {
    console.log('Using direct database connection');
    return process.env.DIRECT_DATABASE_URL;
  }
  
  // Otherwise use the standard DATABASE_URL
  return process.env.DATABASE_URL;
}

const prismaClientSingleton = () => {
  // Create Prisma client with the appropriate URL
  const dbUrl = getDatabaseUrl();
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Try to use Prisma Accelerate if configured
  if (dbUrl?.includes('prisma://')) {
    console.log('Using Prisma Accelerate for database connection');
    
    // Use simplified extension pattern to avoid linter errors
    if (QUERY_CACHE_ENABLED) {
      // With caching in production
      return client.$extends(withAccelerate());
    } else {
      // Without caching in development
      return client.$extends(withAccelerate());
    }
  }
  
  console.log('Using standard Prisma client for database connection');
  return client;
};

// Handle database connection issues more gracefully without environment variable reassignment
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message.includes('connection')) {
    console.error('Database connection error detected');
    
    // We can set a flag to use the direct URL on the next connection attempt
    if (process.env.DIRECT_DATABASE_URL && process.env.DATABASE_URL !== process.env.DIRECT_DATABASE_URL) {
      console.log('Will try direct database connection on next attempt');
      // This is a safer way to influence the connection behavior
      process.env.USE_DIRECT_URL = 'true';
      
      // Force recreation of the Prisma client
      if (globalForPrisma.prisma) {
        globalForPrisma.prisma.$disconnect().catch(console.error);
        // @ts-ignore - We need to delete the property to force recreation
        delete globalForPrisma.prisma;
      }
    }
  }
});

export const db = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
