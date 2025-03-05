import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Use any to avoid TypeScript errors with the extended client
declare global {
  // eslint-disable-next-line no-var
  var prisma: any;
}

// Initialize Prisma Client with Accelerate extension
const prismaClientSingleton = () => {
  try {
    return new PrismaClient().$extends(withAccelerate());
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