#!/usr/bin/env node
/**
 * Redis Test Script for JackerBox
 * 
 * This script tests the Redis connection using node-redis client
 * 
 * Run with: node scripts/test-redis.js
 */

const { createClient } = require('redis');
require('dotenv').config();

const BRIGHT_GREEN = '\x1b[32m';
const BRIGHT_RED = '\x1b[31m';
const BRIGHT_YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Helper function to log with color
function log(message, type = 'info') {
  const color = type === 'success' ? BRIGHT_GREEN : type === 'error' ? BRIGHT_RED : BRIGHT_YELLOW;
  console.log(`${color}${message}${RESET}`);
}

async function testRedisConnection() {
  log('🧪 REDIS CONNECTION TEST 🧪', 'info');
  log('===========================', 'info');
  
  try {
    log('Initializing Redis client...', 'info');
    
    const redisUrl = process.env.REDIS_URL || "rediss://default:AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA@prime-ostrich-21240.upstash.io:6379";
    
    log(`Connecting to Redis at: ${redisUrl.replace(/\/\/(.+?):.+?@/, '//***:***@')}`, 'info');
    
    const client = createClient({
      url: redisUrl
    });
    
    client.on('error', (err) => {
      log(`Redis Client Error: ${err.message}`, 'error');
      throw err;
    });
    
    // Connect to Redis
    log('Connecting...', 'info');
    await client.connect();
    log('Connected successfully!', 'success');
    
    // Test setting a value
    const testKey = `test_key_${Date.now()}`;
    const testValue = `test_value_${Date.now()}`;
    
    log(`Setting key: ${testKey} = ${testValue}`, 'info');
    await client.set(testKey, testValue);
    log('Value set successfully!', 'success');
    
    // Test getting a value
    log(`Getting key: ${testKey}`, 'info');
    const retrievedValue = await client.get(testKey);
    
    if (retrievedValue !== testValue) {
      throw new Error(`Value mismatch! Expected: ${testValue}, Got: ${retrievedValue}`);
    }
    
    log(`Value retrieved successfully: ${retrievedValue}`, 'success');
    
    // Clean up
    log('Deleting test key...', 'info');
    await client.del(testKey);
    log('Test key deleted', 'success');
    
    // Disconnect
    log('Disconnecting...', 'info');
    await client.disconnect();
    log('Disconnected successfully!', 'success');
    
    log('\n✅ Redis connection test passed successfully!', 'success');
  } catch (error) {
    log(`\n❌ Redis connection test failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
testRedisConnection(); 