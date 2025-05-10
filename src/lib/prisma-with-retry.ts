import { PrismaClient } from '@prisma/client';

// Maximum number of retries for connection errors
const MAX_RETRIES = 3;

// Create a custom Prisma client with retry logic
class PrismaWithRetry {
  prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
    });

    // Automatically connect when the client is created
    this.connect();
  }

  // Method to handle connection to database
  async connect() {
    try {
      await this.prisma.$connect();
      console.log('Connected to database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  // Disconnect from the database
  async disconnect() {
    await this.prisma.$disconnect();
  }

  // Generic method to execute a Prisma query with retry logic
  async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
    let retries = 0;
    let lastError: any;

    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Only retry on connection errors (which could be due to Neon scaling to zero)
        const isConnectionError = 
          error.message.includes('Connection') || 
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED');

        if (isConnectionError) {
          retries++;
          console.log(`Database operation failed. Retrying (${retries}/${maxRetries})...`);
          
          // Try to reconnect before retrying
          try {
            await this.prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
            await this.prisma.$connect();
          } catch (reconnectError) {
            console.error('Failed to reconnect:', reconnectError);
          }
        } else {
          // For other types of errors, don't retry
          throw error;
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError;
  }

  // Create wrapper methods for all Prisma models
  get user() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.user.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.user.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.user.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.user.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.user.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.user.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.user.count(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.user.updateMany(args)),
    };
  }

  // Equipment model wrapper
  get equipment() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.equipment.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.equipment.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.equipment.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.equipment.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.equipment.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.equipment.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.equipment.count(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.equipment.updateMany(args)),
    };
  }

  // VerificationRequest model wrapper
  get verificationRequest() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.update(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.updateMany(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.verificationRequest.count(args)),
    };
  }

  // Rental model wrapper - add to fix TypeScript errors
  get rental() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.rental.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.rental.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.rental.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.rental.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.rental.update(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.rental.updateMany(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.rental.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.rental.count(args)),
    };
  }

  // Payment model wrapper - add to fix TypeScript errors
  get payment() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.payment.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.payment.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.payment.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.payment.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.payment.update(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.payment.updateMany(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.payment.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.payment.count(args)),
    };
  }

  // Notification model wrapper - add to fix TypeScript errors
  get notification() {
    return {
      findMany: (args: any) => this.executeWithRetry(() => this.prisma.notification.findMany(args)),
      findUnique: (args: any) => this.executeWithRetry(() => this.prisma.notification.findUnique(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.prisma.notification.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.prisma.notification.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.prisma.notification.update(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.prisma.notification.updateMany(args)),
      delete: (args: any) => this.executeWithRetry(() => this.prisma.notification.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.prisma.notification.count(args)),
    };
  }

  // For direct queries
  async $queryRaw(query: any, ...params: any[]) {
    return this.executeWithRetry(() => this.prisma.$queryRaw(query, ...params));
  }

  async $executeRaw(query: any, ...params: any[]) {
    return this.executeWithRetry(() => this.prisma.$executeRaw(query, ...params));
  }

  // Method to execute transactions with retry logic
  async $transaction(operations: any, options?: any) {
    return this.executeWithRetry(() => this.prisma.$transaction(operations, options));
  }
}

// Export a singleton instance
const prismaWithRetry = new PrismaWithRetry();
export default prismaWithRetry; 