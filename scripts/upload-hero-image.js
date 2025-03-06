import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Define the path to the sample images
const sampleImagesDir = path.join(process.cwd(), 'public', 'sample-images');

// Create the directory if it doesn't exist
if (!fs.existsSync(sampleImagesDir)) {
  fs.mkdirSync(sampleImagesDir, { recursive: true });
}

// Sample image URLs for equipment
const sampleImageUrls = [
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1470&auto=format&fit=crop',  // Construction equipment
  'https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?q=80&w=1470&auto=format&fit=crop',  // Professional camera setup
  'https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?q=80&w=1470&auto=format&fit=crop',  // Audio equipment
  'https://images.unsplash.com/photo-1603732551681-2e91159b9dc2?q=80&w=1374&auto=format&fit=crop',  // DJ equipment
  'https://images.unsplash.com/photo-1588495752527-77d65c21f7cd?q=80&w=1374&auto=format&fit=crop',  // Power tools
];

// Function to download an image from a URL
async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filePath = path.join(sampleImagesDir, filename);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ Downloaded image to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error(`❌ Error downloading image: ${error.message}`);
    return null;
  }
}

// Function to upload an image to Cloudinary
async function uploadToCloudinary(filePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'jackerbox',
      public_id: publicId,
      overwrite: true,
      resource_type: 'image'
    });
    
    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading to Cloudinary: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting hero image upload process...');
  
  // Download and upload the hero image
  const heroImageUrl = 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=1470&auto=format&fit=crop';
  const heroImageFilename = 'hero-equipment.jpg';
  
  const filePath = await downloadImage(heroImageUrl, heroImageFilename);
  if (filePath) {
    const cloudinaryUrl = await uploadToCloudinary(filePath, 'hero-equipment');
    if (cloudinaryUrl) {
      console.log(`\n🎉 Hero image uploaded successfully!`);
      console.log(`📝 Use this URL in your code: ${cloudinaryUrl}`);
    }
  }
  
  // Download and upload sample equipment images
  console.log('\n🚀 Uploading sample equipment images...');
  
  for (let i = 0; i < sampleImageUrls.length; i++) {
    const filename = `equipment-sample-${i + 1}.jpg`;
    const filePath = await downloadImage(sampleImageUrls[i], filename);
    
    if (filePath) {
      const cloudinaryUrl = await uploadToCloudinary(filePath, `equipment-sample-${i + 1}`);
      if (cloudinaryUrl) {
        console.log(`📝 Sample image ${i + 1}: ${cloudinaryUrl}`);
      }
    }
  }
  
  console.log('\n✅ All images processed!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 