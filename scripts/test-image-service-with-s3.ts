import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";
import { processImage } from "../src/lib/image-service";
import { verifyRealPhoto } from "../src/lib/aws/rekognition-service";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get the S3 bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-images";
const region = process.env.AWS_REGION || "us-east-2";

// Test file name - this should be a file you've manually uploaded to your S3 bucket
const testFileName = "test-image.jpg"; // Change this to match a file you've uploaded

// Construct the S3 URL
const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${testFileName}`;

// Function to download image as buffer
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function testImageServiceWithS3() {
  console.log("Testing image service with S3 URL:", s3Url);
  
  try {
    // Download the image first
    const imageBuffer = await downloadImage(s3Url);
    
    // Test processImage function
    console.log("\nTesting processImage function...");
    const processResult = await processImage(imageBuffer, "image/jpeg", "test");
    
    if (processResult.isValid) {
      console.log("✅ Image processing successful!");
      console.log("S3 Key:", processResult.s3Key);
      console.log("Cloudinary URL:", processResult.cloudinaryUrl);
    } else {
      console.log("❌ Image processing failed!");
      console.log("Message:", processResult.message);
    }
    
    // Test verifyRealPhoto function
    console.log("\nTesting verifyRealPhoto function...");
    const verifyResult = await verifyRealPhoto(imageBuffer);
    
    console.log("✅ Photo verification result:", verifyResult);
    
    return true;
  } catch (error) {
    console.error("Error testing image service with S3:", error);
    return false;
  }
}

// Run the test
testImageServiceWithS3(); 