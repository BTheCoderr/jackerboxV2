#!/usr/bin/env node
/**
 * Simple Cloudinary Upload Test
 */

const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

console.log('🧪 SIMPLE CLOUDINARY UPLOAD TEST 🧪');
console.log('===================================');

// Configure Cloudinary directly with the credentials
cloudinary.config({
  cloud_name: 'dgtqpyphg',
  api_key: '646841252992477',
  api_secret: 'Zxu873QWGlD6cYq2gB9cqFO6wG0',
  secure: true
});

console.log('Cloudinary configured with:');
console.log(`- Cloud name: ${cloudinary.config().cloud_name}`);

// Create a simple test text file
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'Hello Cloudinary! This is a test file.');
console.log(`Created test file at: ${testFilePath}`);

// Upload the text file
async function uploadTestFile() {
  try {
    console.log('Uploading test file...');
    
    const uploadResult = await cloudinary.uploader.upload(testFilePath, {
      resource_type: 'raw',
      public_id: `test-file-${Date.now()}`,
      folder: 'test-files'
    });
    
    console.log('✅ File uploaded successfully!');
    console.log(`File URL: ${uploadResult.secure_url}`);
    console.log(`Public ID: ${uploadResult.public_id}`);
    console.log(`File type: ${uploadResult.resource_type}`);
    console.log(`File size: ${uploadResult.bytes} bytes`);
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('Test file cleaned up.');
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadTestFile(); 