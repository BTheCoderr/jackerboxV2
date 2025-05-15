#!/usr/bin/env node
/**
 * Cloudinary Upload Test Script for JackerBox
 * 
 * This script tests Cloudinary image upload functionality
 * 
 * Run with: node scripts/test-cloudinary-upload.js
 */

const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
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

// Create a test image if needed
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  // Check if test image already exists
  if (fs.existsSync(testImagePath)) {
    log('Test image already exists, using existing file', 'info');
    return testImagePath;
  }
  
  log('Creating test image...', 'info');
  
  // Simple method to create a 100x100 black PNG
  const imageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9' +
    'kT1Iw0AcxV9TpSIVh3YQcchQnSyIijhKFYtgobQVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg' +
    '+AHi5Oik6CIl/i8ptIjx4Lgf7+497t4BQqPCVLNrAlA1y0jFY2I2tyr2vCKAfoQxgojMLGNOkpLw' +
    'HF/38PH1LsqzvM/9OfrVvMUAn0g8ywzTJt4gnt60dM77xBFWllTic+Ixky5I/Mh1xeM3zgWXBZ4Z' +
    'MdOpOeIIsVhoY7mNWdFQiaeIo4qqUb6QdVnhvMVZrdRY6578heG8vrLMdZpDiGMRS5AgQkEVJZRh' +
    'IUqrRoqJFO3HPPzDjj9JLplcJTByLKACFZLjB/+D392a+ckJNykYA7pfbPtjFOjZBZp12/4+tu3m' +
    'CeB/Bq60tr/aAGY/Sa+3tcgR0L8NXFy3NXkPuNwBhp50yZAcyU9TKBSADwb0TXngoNsF+q1ur9Wb' +
    '7dxPOI8ckiMFNHwL/O8GUPTqUvjfU7f3+ufRMzsP4VkURQsaAAAAAABQTFRFAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9cDSPQAAAA10Uk5TABIqK1Z/qqvF' +
    '7O34+fr1rq0AAAEwSURBVHja7dNRDcAgFATRjgZkIAUVqBgpSMEJMtoXmg8Q7l1AJllyq2ZBAADA' +
    'z2sRs2KA2K5Cdrr6HUTIkfL9alZW13HqOC+lZQV2HWeJCdJx7joqJUTIkA6lnZRbSZQOZHbpQO61' +
    'HkSIkBokEIIEQpBACBIIQQIhSCAECYQggRAkEIIEQpBACBIIQQIhSCAECYQggRAkEIIEQpBACBII' +
    'QXbgPJLG6f5TTohQHyKk51DTpowQoT5ESK8hIUKECKlPSZtCDR1khAgRIkSIkHtC0m5jO2Rtyjzl' +
    'hAgREi4kLXRXIWlLIkSIECFCbgnJh6RtpYUI9SEjX6tChPrQd8i/T+PDQo4cESJEiBAhQnq+GHr1' +
    'W4gQIc9BiJCeQwCG8wAw6Q0ysQAAAhRvlGvLEXEAAAAASUVORK5CYII=',
    'base64'
  );
  
  fs.writeFileSync(testImagePath, imageData);
  log('Test image created successfully!', 'success');
  return testImagePath;
}

async function testCloudinaryUpload() {
  log('🧪 CLOUDINARY UPLOAD TEST 🧪', 'info');
  log('============================', 'info');
  
  try {
    log('Initializing Cloudinary client...', 'info');
    
    // Reset configuration and set new values
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgtqpyphg';
    const apiKey = process.env.CLOUDINARY_API_KEY || '646841252992477';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'Zxu873QWGlD6cYq2gB9cqFO6wG0';
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    
    log('Cloudinary configured!', 'info');
    log(`Using cloud_name: ${cloudinary.config().cloud_name}`, 'info');
    
    // Create test image
    const testImagePath = createTestImage();
    log(`Test image path: ${testImagePath}`, 'info');
    
    // Upload test image
    log('Uploading test image to Cloudinary...', 'info');
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      public_id: `test-upload-${Date.now()}`,
      folder: 'test',
      resource_type: 'image'
    });
    
    log('Image uploaded successfully!', 'success');
    log(`Image public_id: ${uploadResult.public_id}`, 'info');
    log(`Image URL: ${uploadResult.secure_url}`, 'info');
    log(`Image size: ${uploadResult.bytes} bytes`, 'info');
    log(`Image format: ${uploadResult.format}`, 'info');
    log(`Image dimensions: ${uploadResult.width}x${uploadResult.height}`, 'info');
    
    log('\n✅ Cloudinary upload test passed successfully!', 'success');
    return uploadResult;
  } catch (error) {
    log(`\n❌ Cloudinary upload test failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
testCloudinaryUpload(); 