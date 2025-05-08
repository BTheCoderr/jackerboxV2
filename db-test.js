const { executeQuery, testConnection, closePool } = require('./src/lib/db-connection');

async function runTest() {
  console.log('Running database connection test...');
  
  try {
    // First test the connection
    await testConnection();
    
    // Run a few simple queries
    console.log('\nRunning sample queries:');
    
    // Get database version
    const versionResult = await executeQuery('SELECT version()');
    console.log('Database version:', versionResult.rows[0].version);
    
    // Get current timestamp 
    const timeResult = await executeQuery('SELECT NOW() as current_time');
    console.log('Current database time:', timeResult.rows[0].current_time);
    
    // Try a query with parameters
    const paramResult = await executeQuery('SELECT $1::text as message', ['Connection pool is working!']);
    console.log('Message:', paramResult.rows[0].message);
    
    console.log('\nAll queries completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Always close the pool when done
    await closePool();
  }
}

// Run the test
runTest(); 