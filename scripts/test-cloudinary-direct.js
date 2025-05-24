#!/usr/bin/env node
/**
 * Simple Cloudinary Test Script for JackerBox
 * 
 * This script tests the Cloudinary connection using environment variables
 * 
 * Run with: node scripts/test-cloudinary-direct.js
 */

const cloudinary = require('cloudinary').v2;

console.log('🧪 CLOUDINARY DIRECT CONNECTION TEST 🧪');
console.log('=====================================');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configured with:');
console.log(`- Cloud name: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Not configured'}`);
console.log(`- API Key: ${process.env.CLOUDINARY_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`- API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Configured' : 'Not configured'}`);

// Test the connection
async function testCloudinaryConnection() {
  try {
    console.log('Testing Cloudinary connection...');
    console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Not configured');
    console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Configured' : 'Not configured');
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Configured' : 'Not configured');
    
    // Test API connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testCloudinaryConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { testCloudinaryConnection }; 