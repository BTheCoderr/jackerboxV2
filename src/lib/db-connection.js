const { Pool } = require('pg');
require('dotenv').config();

// Get configuration from environment variables
const MAX_CONNECTIONS = parseInt(process.env.PG_POOL_MAX || '20', 10);
const MAX_RETRIES = parseInt(process.env.PG_CONNECTION_RETRIES || '3', 10);
const USE_SSL = process.env.DATABASE_SSL !== 'false';

// Parse connection string to see if it contains sslmode=disable
let forceDisableSSL = false;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable')) {
  forceDisableSSL = true;
  console.log('SSL disabled via connection string parameter');
}

// Create the connection pool
let pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: MAX_CONNECTIONS,
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // timeout before a connection attempt is considered failed
  ssl: (!USE_SSL || forceDisableSSL) ? false : { rejectUnauthorized: false } // Allow self-signed certs
});

// Handle pool errors without crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the process, just log the error
});

// Function to execute a query with automatic retries
async function executeQuery(text, params = [], maxRetries = MAX_RETRIES) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      // Get a client from the pool
      const client = await pool.connect();
      
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        // Release the client back to the pool regardless of success/failure
        client.release();
      }
    } catch (error) {
      lastError = error;
      
      // Only retry on connection errors (which could be due to Neon scaling to zero)
      if (error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' || 
          error.message.includes('Connection terminated') ||
          error.message.includes('connection to server') ||
          error.message.includes('SSL')) {
        
        retries++;
        console.log(`Database connection failed. Retrying (${retries}/${maxRetries})...`);
        
        // On first SSL error, try to disable SSL
        if (error.message.includes('SSL') && retries === 1 && USE_SSL) {
          console.log('SSL error detected, trying without SSL...');
          // Create a new pool without SSL
          pool.end();
          pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: MAX_CONNECTIONS,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: false
          });
        }
        
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
      } else {
        // For other types of errors, don't retry
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

// Test the connection and retry logic
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await executeQuery('SELECT current_database() as db_name');
    console.log('Success! Connected to database:', result.rows[0].db_name);
    return true;
  } catch (error) {
    console.error('Connection error after retries:', error.message);
    return false;
  }
}

// Function to gracefully end the pool when your application is shutting down
async function closePool() {
  await pool.end();
  console.log('Pool has ended');
}

module.exports = {
  pool,
  executeQuery,
  testConnection,
  closePool
}; 