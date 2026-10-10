import { PrismaClient } from '../../prisma/generated/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// This approach is to prevent creating multiple instances of Prisma in development
export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

function createPrismaClient() {
  try {
    // Configure Prisma Client with a connection retry strategy to handle Neon auto-suspend
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Add retry logic for transient connection errors
      errorFormat: 'minimal',
    });
    
    // Wrap client queries with retry logic for Neon auto-suspend wakeup
    const originalConnect = client.$connect.bind(client);
    client.$connect = async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          return await originalConnect();
        } catch (error: any) {
          if (retries === 1 || !isRetryableError(error)) {
            throw error;
          }
          console.log(`Database connection failed, retrying (${retries - 1} attempts left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          retries--;
        }
      }
    };
    
    // Test the connection
    client.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

    return client;
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    // Never fake successful database operations when the real client fails.
    throw error;
  }
}

// Helper function to determine if an error is retryable
function isRetryableError(error: any): boolean {
  // Handle Neon auto-suspend errors and other transient connection issues
  if (
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("Connection terminated unexpectedly") ||
    error.message?.includes("Connection refused") ||
    error.message?.includes("terminating connection due to administrator command") ||
    error.message?.includes("the connection attempt failed") ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'P1001' // Prisma can't reach database server
  ) {
    return true;
  }
  return false;
}

// Export only once
export default db;
