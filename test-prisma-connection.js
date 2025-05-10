const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Create a custom error handler for Prisma
class PrismaWithRetry {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      errorFormat: 'minimal'
    });
    
    this.maxRetries = parseInt(process.env.PG_CONNECTION_RETRIES || '3', 10);
  }
  
  // Generic method to execute a Prisma query with retry logic
  async executeWithRetry(operation) {
    let retries = 0;
    let lastError;

    while (retries < this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if it's a connection error that we should retry
        const isConnectionError = 
          error.message.includes('Connection') || 
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.code === 'P1001' || // Authentication failed (can happen when DB is starting)
          error.code === 'P1002' || // The server closed the connection
          error.code === 'P1008'; // Operation timed out
        
        if (isConnectionError) {
          retries++;
          console.log(`Database operation failed. Retrying (${retries}/${this.maxRetries})...`);
          
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          
          // Reconnect to the database
          await this.prisma.$disconnect();
          await this.prisma.$connect();
        } else {
          // For other types of errors, don't retry
          throw error;
        }
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError;
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

// Run the test
async function runTest() {
  const prisma = new PrismaWithRetry();
  
  try {
    console.log('Testing Prisma connection with retry logic...');
    
    // Test 1: Get database version using $queryRaw
    console.log('\nTest 1: Raw query');
    const version = await prisma.executeWithRetry(() => 
      prisma.prisma.$queryRaw`SELECT version()`
    );
    console.log('Database version:', version[0].version);
    
    // Test 2: Get user count
    console.log('\nTest 2: Model query - user count');
    const userCount = await prisma.executeWithRetry(() => 
      prisma.prisma.user.count()
    );
    console.log('Number of users:', userCount);
    
    // Test 3: Find first user
    console.log('\nTest 3: Model query - find first user');
    const firstUser = await prisma.executeWithRetry(() => 
      prisma.prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          createdat: true
        }
      })
    );
    console.log('First user:', firstUser);
    
    console.log('\nAll Prisma tests completed successfully!');
  } catch (error) {
    console.error('Error during Prisma testing:', error);
  } finally {
    await prisma.close();
    console.log('Prisma client disconnected');
  }
}

runTest(); 