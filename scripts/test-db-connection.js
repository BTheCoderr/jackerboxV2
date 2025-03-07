import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const initPrismaClient = () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    const directUrl = process.env.DIRECT_DATABASE_URL || '';
    
    console.log('Database URL:', databaseUrl.substring(0, 20) + '...');
    console.log('Direct URL:', directUrl.substring(0, 20) + '...');
    
    // Only use Accelerate extension if the URL starts with prisma://
    if (databaseUrl.startsWith('prisma://')) {
      console.log('Using Prisma Accelerate');
      return new PrismaClient().$extends(withAccelerate({
        caching: {
          ttl: 60, // 60 seconds
          exclude: {
            models: ['Session', 'VerificationToken'],
            queries: ['findMany', 'count'],
          },
        },
      }));
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

async function testConnection() {
  console.log('Testing database connection...');
  
  const prisma = initPrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    console.log('Testing simple query...');
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const duration = Date.now() - startTime;
    console.log('✅ Query successful:', result);
    console.log(`Query took ${duration}ms`);
    
    // Test a more complex query with performance measurement
    console.log('\nTesting performance with multiple queries...');
    
    // Test 1: Count users
    const countStart = Date.now();
    const userCount = await prisma.user.count();
    const countDuration = Date.now() - countStart;
    console.log(`User count: ${userCount} (${countDuration}ms)`);
    
    // Test 2: Find users with relations
    const findStart = Date.now();
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        equipmentListings: true,
      },
    });
    const findDuration = Date.now() - findStart;
    console.log(`Found ${users.length} users with equipment (${findDuration}ms)`);
    
    // Test 3: Repeated query to test caching
    console.log('\nTesting query caching...');
    
    // First query (should be uncached)
    const firstQueryStart = Date.now();
    await prisma.user.findUnique({
      where: { id: users[0]?.id || 'unknown' },
    });
    const firstQueryDuration = Date.now() - firstQueryStart;
    console.log(`First query: ${firstQueryDuration}ms`);
    
    // Second query (might be cached)
    const secondQueryStart = Date.now();
    await prisma.user.findUnique({
      where: { id: users[0]?.id || 'unknown' },
    });
    const secondQueryDuration = Date.now() - secondQueryStart;
    console.log(`Second query: ${secondQueryDuration}ms`);
    
    // Performance improvement
    const improvement = firstQueryDuration > 0 
      ? ((firstQueryDuration - secondQueryDuration) / firstQueryDuration * 100).toFixed(2)
      : 0;
    console.log(`Performance improvement: ${improvement}%`);
    
    // Test connection pool with concurrent queries
    console.log('\nTesting connection pool with concurrent queries...');
    const concurrentStart = Date.now();
    const promises = Array(10).fill(0).map(() => 
      prisma.user.findMany({ take: 1 })
    );
    await Promise.all(promises);
    const concurrentDuration = Date.now() - concurrentStart;
    console.log(`10 concurrent queries completed in ${concurrentDuration}ms`);
    
    await prisma.$disconnect();
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    // Try with direct connection if available
    if (process.env.DIRECT_DATABASE_URL) {
      try {
        console.log('\nTrying with DIRECT_DATABASE_URL...');
        process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
        
        const directPrisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.DIRECT_DATABASE_URL,
            },
          },
        });
        
        await directPrisma.$connect();
        console.log('✅ Direct connection successful!');
        
        // Test a simple query
        const result = await directPrisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Query successful:', result);
        
        await directPrisma.$disconnect();
      } catch (directError) {
        console.error('❌ Direct connection failed:', directError);
      }
    }
  }
}

testConnection().finally(() => {
  console.log('Test completed.');
}); 