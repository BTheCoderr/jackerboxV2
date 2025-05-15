#!/usr/bin/env node
/**
 * Simple Cloudinary Image Upload Test
 */

const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

console.log('🧪 SIMPLE CLOUDINARY IMAGE UPLOAD TEST 🧪');
console.log('========================================');

// Configure Cloudinary directly with the credentials
cloudinary.config({
  cloud_name: 'dgtqpyphg',
  api_key: '646841252992477',
  api_secret: 'Zxu873QWGlD6cYq2gB9cqFO6wG0',
  secure: true
});

console.log('Cloudinary configured with:');
console.log(`- Cloud name: ${cloudinary.config().cloud_name}`);

// Create a simple test SVG image (which is just a text file)
const testFilePath = path.join(__dirname, 'test-image.svg');
const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="blue" />
  <text x="10" y="50" font-family="Arial" font-size="14" fill="white">Test SVG</text>
</svg>`;

fs.writeFileSync(testFilePath, svgContent);
console.log(`Created test SVG at: ${testFilePath}`);

// Upload the SVG image
async function uploadTestImage() {
  try {
    console.log('Uploading test SVG...');
    
    const uploadResult = await cloudinary.uploader.upload(testFilePath, {
      resource_type: 'image',
      public_id: `test-image-${Date.now()}`,
      folder: 'test-images'
    });
    
    console.log('✅ Image uploaded successfully!');
    console.log(`Image URL: ${uploadResult.secure_url}`);
    console.log(`Public ID: ${uploadResult.public_id}`);
    console.log(`Image type: ${uploadResult.format}`);
    console.log(`Image size: ${uploadResult.bytes} bytes`);
    console.log(`Dimensions: ${uploadResult.width}x${uploadResult.height}`);
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('Test image cleaned up.');
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadTestImage(); 