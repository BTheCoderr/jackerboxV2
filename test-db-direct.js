import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient instance without any extensions
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing direct database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Try to connect and run a simple query
    const result = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
      },
    });
    
    console.log('Connection successful!');
    console.log('User sample:', result);
    
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