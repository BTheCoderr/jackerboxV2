// Simple test script to verify our connection pooling solution
const db = require('./src/lib/db-connection');

async function runTest() {
  try {
    // First, test the connection
    const connected = await db.testConnection();
    
    if (connected) {
      console.log('\nRunning a series of queries to test connection stability:');
      
      // Run multiple queries in sequence to test
      for (let i = 0; i < 5; i++) {
        const result = await db.executeQuery('SELECT now() as time');
        console.log(`Query ${i+1}: Current time on database: ${result.rows[0].time}`);
        
        // Add a small delay between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('\nTesting concurrent queries:');
      // Run multiple queries concurrently to test pool
      const promises = Array(5).fill(0).map((_, i) => 
        db.executeQuery('SELECT pg_sleep(1), $1 as query_num', [i])
          .then(result => console.log(`Concurrent query ${i} completed`))
      );
      
      await Promise.all(promises);
      console.log('All concurrent queries completed successfully');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Always close the pool at the end of your application
    await db.closePool();
  }
}

// Run the test
runTest(); 