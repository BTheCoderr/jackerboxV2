#!/usr/bin/env node
/**
 * Integration Test Script for JackerBox
 * 
 * This script tests various integrations to ensure they're working correctly:
 * - Redis connection test
 * - Cloudinary configuration check
 * - Stripe API check
 * 
 * Run with: node scripts/test-integrations.js
 */

const { createClient } = require('@upstash/redis');
const fetch = require('node-fetch');
const Stripe = require('stripe');
const { v2: cloudinary } = require('cloudinary');
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

// Helper function for testing
async function runTest(name, testFn) {
  log(`\n📋 Testing ${name}...`, 'info');
  try {
    await testFn();
    log(`✅ ${name} test passed!`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${name} test failed: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Test Redis connection
async function testRedisConnection() {
  log('Initializing Redis client...');
  
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('Redis environment variables are not set. Check KV_REST_API_URL and KV_REST_API_TOKEN');
  }
  
  const redis = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  // Test set and get
  const testKey = `test_${Date.now()}`;
  const testValue = `This is a test value: ${new Date().toISOString()}`;
  
  log(`Setting test key: ${testKey}`);
  await redis.set(testKey, testValue);
  
  log('Getting test key...');
  const retrievedValue = await redis.get(testKey);
  
  if (retrievedValue !== testValue) {
    throw new Error(`Redis value mismatch: got "${retrievedValue}" instead of "${testValue}"`);
  }

  log('Deleting test key...');
  await redis.del(testKey);
  
  log('Redis connection is working properly!');
}

// Test Cloudinary configuration
async function testCloudinaryConfig() {
  log('Checking Cloudinary configuration...');
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are not set');
  }
  
  // Configure with environment variables
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Get account info as a ping test
  const accountInfo = await cloudinary.api.ping();
  
  if (!accountInfo || accountInfo.status !== 'ok') {
    throw new Error('Failed to connect to Cloudinary');
  }
  
  log('Cloudinary configuration is valid!');
}

// Test Stripe API
async function testStripeAPI() {
  log('Testing Stripe API connection...');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe environment variable STRIPE_SECRET_KEY is not set');
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  // Simple test: list customers (limited to 1)
  const customers = await stripe.customers.list({ limit: 1 });
  
  if (!customers || !customers.data) {
    throw new Error('Failed to get response from Stripe API');
  }
  
  log('Stripe API connection is working!');
}

// Test deployment base URL
async function testDeploymentBaseURL() {
  const baseURL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  
  if (!baseURL) {
    log('No deployment URL found in environment variables.', 'error');
    return false;
  }
  
  log(`Testing deployment URL: ${baseURL}`);
  
  try {
    const response = await fetch(baseURL);
    if (response.ok) {
      log(`Deployment URL is accessible! Status: ${response.status}`, 'success');
      return true;
    } else {
      log(`Deployment URL returned status: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed to connect to deployment URL: ${error.message}`, 'error');
    return false;
  }
}

// Main function
async function main() {
  log('🧪 JACKERBOX INTEGRATION TESTS 🧪', 'info');
  log('===============================', 'info');
  
  let passed = 0;
  let total = 0;

  // Run all tests
  total++;
  if (await runTest('Redis Connection', testRedisConnection)) passed++;
  
  total++;
  if (await runTest('Cloudinary Configuration', testCloudinaryConfig)) passed++;
  
  total++;
  if (await runTest('Stripe API', testStripeAPI)) passed++;
  
  total++;
  if (await runTest('Deployment URL', testDeploymentBaseURL)) passed++;
  
  // Summary
  log('\n===============================', 'info');
  log(`Test Summary: ${passed}/${total} tests passed`, passed === total ? 'success' : 'error');
  
  if (passed === total) {
    log('\n🎉 All integration tests passed! Your app is ready to go!', 'success');
    process.exit(0);
  } else {
    log('\n⚠️ Some tests failed. Please check the errors above.', 'error');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
}); 