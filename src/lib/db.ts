import { PrismaClient } from '../../prisma/generated/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// This approach is to prevent creating multiple instances of Prisma in development
export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

/**
 * Guard against pointing a JackerBox preview at another application's database.
 * This is opt-in through a non-secret environment variable.
 * Never include connection strings in error logs.
 */
function assertExpectedSupabaseProject(databaseUrl: string | undefined) {
  const expectedRef = process.env.JACKERBOX_SUPABASE_PROJECT_REF;
  if (!expectedRef) return;
  if (!/^[a-z0-9]{20}$/.test(expectedRef) || !databaseUrl) {
    throw new Error("Supabase preview database configuration is incomplete");
  }
  try {
    const url = new URL(databaseUrl);
    const protocolValid = url.protocol === "postgresql:" || url.protocol === "postgres:";
    const directMatch = url.hostname === `db.${expectedRef}.supabase.co`;
    const poolerMatch = url.hostname.endsWith(".pooler.supabase.com")
      && decodeURIComponent(url.username).endsWith(`.${expectedRef}`);
    if (!protocolValid || (!directMatch && !poolerMatch)) {
      throw new Error("project mismatch");
    }
  } catch {
    throw new Error("Database URL does not match the expected Supabase project");
  }
}

function createPrismaClient() {
  try {
    assertExpectedSupabaseProject(process.env.DATABASE_URL);
    // Configure Prisma Client with PostgreSQL URL supplied by the hosting provider
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      ...(process.env.DATABASE_URL ? { datasources: { db: { url: process.env.DATABASE_URL } } } : {}),
      // Add retry logic for transient connection errors
      errorFormat: 'minimal',
    });
    
    // Retain bounded retries for transient PostgreSQL connection failures
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
    
    // Do not connect at module import time. Queries connect lazily at runtime;
    // eager connections break production builds and trigger unnecessary cold-start traffic.

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
