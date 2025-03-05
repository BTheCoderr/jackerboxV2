import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Use any to avoid TypeScript errors with the extended client
declare global {
  // eslint-disable-next-line no-var
  var prisma: any;
}

// Initialize Prisma Client with Accelerate extension
const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate());
};

export const db = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
} 