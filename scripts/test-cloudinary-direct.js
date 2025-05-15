#!/usr/bin/env node
/**
 * Simple Cloudinary Test Script for JackerBox
 * 
 * This script tests the Cloudinary connection using hardcoded credentials
 * 
 * Run with: node scripts/test-cloudinary-direct.js
 */

const { v2: cloudinary } = require('cloudinary');

console.log('🧪 CLOUDINARY DIRECT CONNECTION TEST 🧪');
console.log('=====================================');

// Configure Cloudinary directly with the credentials
cloudinary.config({
  cloud_name: 'dgtqpyphg',
  api_key: '646841252992477',
  api_secret: 'Zxu873QWGlD6cYq2gB9cqFO6wG0',
  secure: true
});

console.log('Cloudinary configured with:');
console.log(`- Cloud name: dgtqpyphg`);
console.log(`- API Key: 646841252992477`);

// Test the connection
async function testConnection() {
  try {
    console.log('Pinging Cloudinary API...');
    const pingResult = await cloudinary.api.ping();
    console.log('Ping result:', pingResult);
    
    console.log('Fetching account info...');
    const accountInfo = await cloudinary.api.usage();
    console.log('Account info:', accountInfo);
    
    console.log('\n✅ Cloudinary connection test passed successfully!');
  } catch (error) {
    console.log('\n❌ Cloudinary connection test failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection(); 