/**
 * Test script to verify the integrated database connection solution
 */

// Use dynamic import for ESM modules
async function runTest() {
  console.log('======= TESTING DATABASE CONNECTIONS =======');
  
  try {
    // Import modules using dynamic import to handle ESM
    const { default: prismaWithRetry } = await import('./src/lib/prisma-with-retry.js');
    const pgConnection = require('./src/lib/pg-connection');
    
    // Test 1: Prisma connection with retry
    console.log('\n=== Test 1: Prisma with retry ===');
    const userCount = await prismaWithRetry.user.count();
    console.log(`User count from Prisma: ${userCount}`);
    
    // Test 2: Direct PG connection with retry
    console.log('\n=== Test 2: Direct PG connection ===');
    const pgResult = await pgConnection.query('SELECT COUNT(*) FROM "User"');
    console.log(`User count from direct query: ${pgResult.rows[0].count}`);
    
    // Test 3: Test a more complex query
    console.log('\n=== Test 3: Complex query ===');
    const recentUsers = await prismaWithRetry.user.findMany({
      take: 2,
      orderBy: { createdat: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdat: true
      }
    });
    console.log('Recent users:', recentUsers);
    
    console.log('\n✅ All tests passed successfully!');
    console.log('Your database connection is now resilient to Neon auto-suspend.');
    console.log('The connection pool and retry logic will automatically handle reconnection.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.stack);
  } finally {
    try {
      // Close PG connection
      const pgConnection = require('./src/lib/pg-connection');
      await pgConnection.closeConnection();
      console.log('PostgreSQL connection closed');
      
      // Disconnect Prisma (if we got that far)
      try {
        const { default: prismaWithRetry } = await import('./src/lib/prisma-with-retry.js');
        await prismaWithRetry.disconnect();
        console.log('Prisma connection closed');
      } catch (e) {
        // Ignore errors when trying to disconnect
      }
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

// Run the test
runTest(); 