import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Use any to avoid TypeScript errors with the extended client
declare global {
  // eslint-disable-next-line no-var
  var prisma: any;
}

// Initialize Prisma Client with Accelerate extension only if using prisma:// protocol
const prismaClientSingleton = () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    
    // Only use Accelerate extension if the URL starts with prisma://
    if (databaseUrl.startsWith('prisma://')) {
      console.log('Using Prisma Accelerate for database connection');
      return new PrismaClient().$extends(withAccelerate());
    } else {
      console.log('Using standard Prisma client for database connection');
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
  } catch (error) {
    console.error("Error initializing Prisma client:", error);
    // Fallback to regular Prisma client without extension
    return new PrismaClient();
  }
};

export const db = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
} 