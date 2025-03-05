import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma Client with the same logic as the application
const initPrismaClient = () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    const directUrl = process.env.DIRECT_DATABASE_URL || '';
    
    console.log('Database URL:', databaseUrl);
    console.log('Direct URL:', directUrl);
    console.log('Database URL type:', typeof databaseUrl);
    console.log('Database URL starts with prisma://', databaseUrl.startsWith('prisma://'));
    
    // Only use Accelerate extension if the URL starts with prisma://
    if (databaseUrl.startsWith('prisma://')) {
      console.log('Using Prisma Accelerate');
      return new PrismaClient().$extends(withAccelerate());
    } else {
      console.log('Using standard Prisma client');
      return new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
  } catch (error) {
    console.error("Error initializing Prisma client:", error);
    // Fallback to regular Prisma client without extension
    return new PrismaClient();
  }
};

const prisma = initPrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect and run a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful!', result);
    
    // Get database version
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('Database version:', version);
    
    // Test a simple query to the User table
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(result => {
    console.log('Test completed:', result);
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 