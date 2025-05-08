import { PrismaClient } from '@prisma/client';

// Maximum number of retries for connection errors
const MAX_RETRIES = 3;

// Create a custom Prisma client with retry logic
class PrismaWithRetry {
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
  async executeWithRetry(operation, maxRetries = MAX_RETRIES) {
    let retries = 0;
    let lastError;

    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (error) {
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
  // This is a simplified example - you'd want to create wrappers for all models you use
  get user() {
    return {
      findMany: (args) => this.executeWithRetry(() => this.prisma.user.findMany(args)),
      findUnique: (args) => this.executeWithRetry(() => this.prisma.user.findUnique(args)),
      findFirst: (args) => this.executeWithRetry(() => this.prisma.user.findFirst(args)),
      create: (args) => this.executeWithRetry(() => this.prisma.user.create(args)),
      update: (args) => this.executeWithRetry(() => this.prisma.user.update(args)),
      delete: (args) => this.executeWithRetry(() => this.prisma.user.delete(args)),
      count: (args) => this.executeWithRetry(() => this.prisma.user.count(args)),
    };
  }

  // Create similar wrapper methods for all your models
  // For example:
  get equipment() {
    return {
      findMany: (args) => this.executeWithRetry(() => this.prisma.equipment.findMany(args)),
      findUnique: (args) => this.executeWithRetry(() => this.prisma.equipment.findUnique(args)),
      findFirst: (args) => this.executeWithRetry(() => this.prisma.equipment.findFirst(args)),
      create: (args) => this.executeWithRetry(() => this.prisma.equipment.create(args)),
      update: (args) => this.executeWithRetry(() => this.prisma.equipment.update(args)),
      delete: (args) => this.executeWithRetry(() => this.prisma.equipment.delete(args)),
      count: (args) => this.executeWithRetry(() => this.prisma.equipment.count(args)),
    };
  }

  // Add more models as needed...

  // For direct queries
  async $queryRaw(query, ...params) {
    return this.executeWithRetry(() => this.prisma.$queryRaw(query, ...params));
  }

  async $executeRaw(query, ...params) {
    return this.executeWithRetry(() => this.prisma.$executeRaw(query, ...params));
  }

  // Method to execute transactions with retry logic
  async $transaction(operations, options) {
    return this.executeWithRetry(() => this.prisma.$transaction(operations, options));
  }
}

// Export a singleton instance
const prismaWithRetry = new PrismaWithRetry();
export default prismaWithRetry; 