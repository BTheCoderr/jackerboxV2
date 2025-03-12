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

const prismaClientSingleton = () => {
  // Create Prisma client
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Try to use Prisma Accelerate if configured
  if (process.env.DATABASE_URL?.includes('prisma://')) {
    console.log('Using Prisma Accelerate for database connection');
    
    // Add Accelerate extension with caching
    return client.$extends(withAccelerate({
      // Enable query caching in production
      caching: QUERY_CACHE_ENABLED ? {
        // Cache GET queries for 60 seconds by default
        ttl: CACHE_TTL,
        // Exclude certain models or queries from caching
        exclude: {
          models: ['Session', 'VerificationToken'],
          queries: ['findMany', 'count'],
        },
      } : false,
    }));
  }
  
  console.log('Using standard Prisma client for database connection');
  return client;
};

// Fallback mechanism for database connection issues
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message.includes('connection')) {
    console.error('Database connection error detected, attempting to reconnect...');
    
    // If we have a direct database URL, try to use it
    if (process.env.DIRECT_DATABASE_URL && process.env.DATABASE_URL !== process.env.DIRECT_DATABASE_URL) {
      console.log('Switching to direct database connection');
      process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
      
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
