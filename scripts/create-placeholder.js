const { v2: cloudinary } = require('cloudinary');
const { createCanvas } = require('canvas');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dgtqpyphg',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a canvas
const width = 400;
const height = 300;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#f3f4f6';
ctx.fillRect(0, 0, width, height);

// Add text
ctx.fillStyle = '#6b7280';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Equipment Image', width/2, height/2);

// Save to file
const buffer = canvas.toBuffer('image/jpeg');
fs.writeFileSync('placeholder-equipment.jpg', buffer);

// Upload to Cloudinary
cloudinary.uploader.upload('placeholder-equipment.jpg', {
  public_id: 'placeholder-equipment',
  overwrite: true
})
.then(result => {
  console.log('Upload successful:', result.secure_url);
  // Clean up local file
  fs.unlinkSync('placeholder-equipment.jpg');
})
.catch(error => {
  console.error('Upload failed:', error);
}); 