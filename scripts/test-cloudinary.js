import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinaryConnection() {
  console.log('Testing Cloudinary connection...');
  console.log('Environment variables:');
  console.log('- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Not set');
  console.log('- CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('- CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not set');
  
  try {
    // Test the connection by getting account info
    const result = await cloudinary.api.ping();
    console.log('\n✅ Cloudinary connection successful!');
    console.log('Response:', result);
    
    // Get account usage info
    const usage = await cloudinary.api.usage();
    console.log('\nAccount Usage:');
    console.log('- Plan:', usage.plan);
    console.log('- Credits used:', usage.credits.used);
    console.log('- Resources:', usage.resources);
    console.log('- Transformations:', usage.transformations);
    console.log('- Objects:', usage.objects);
    
    return true;
  } catch (error) {
    console.error('\n❌ Cloudinary connection failed:');
    console.error(error.message);
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your Cloudinary credentials are correct in your .env file');
    console.log('2. Verify that your Cloudinary account is active');
    console.log('3. Make sure you have internet connectivity');
    console.log('4. Check if your Cloudinary plan has any restrictions');
    
    return false;
  }
}

testCloudinaryConnection(); 