/**
 * Direct PostgreSQL connection utility with connection pooling and retry logic
 * For use in API routes or server-side code that needs direct database access
 */

const { executeQuery, testConnection, closePool } = require('./db-connection');

/**
 * Execute a SQL query with automatic retries
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<Object>} - Query result
 */
async function query(sql, params = []) {
  return executeQuery(sql, params);
}

/**
 * Test database connection
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testDatabaseConnection() {
  return testConnection();
}

/**
 * Close connection pool (call when shutting down the application)
 */
async function closeConnection() {
  return closePool();
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections');
  await closeConnection();
  process.exit(0);
});

module.exports = {
  query,
  testDatabaseConnection,
  closeConnection
}; 