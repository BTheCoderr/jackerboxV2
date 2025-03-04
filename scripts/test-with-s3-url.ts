import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";
import fs from "fs";

// Load environment variables
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use dynamic imports for the services
const importServices = async () => {
  try {
    const rekognitionModule = await import("../src/lib/aws/rekognition-service");
    const cloudinaryModule = await import("../src/lib/cloudinary-service");
    return {
      detectInappropriateContent: rekognitionModule.detectInappropriateContent,
      detectText: rekognitionModule.detectText,
      verifyRealPhoto: rekognitionModule.verifyRealPhoto,
      uploadToCloudinary: cloudinaryModule.uploadToCloudinary
    };
  } catch (error) {
    console.error("Error importing services:", error);
    throw error;
  }
};

// Get the S3 bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-images";
const region = process.env.AWS_REGION || "us-east-2";

// Test file name - this should be a file you've manually uploaded to your S3 bucket
const testFileName = "test-image.jpg"; // Change this to match a file you've uploaded

// Construct the S3 URL
const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${testFileName}`;

/**
 * Download an image from a URL and return it as a Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log(`Downloading image from ${url}...`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Test the image service components with an S3 URL
 */
async function testWithS3Url() {
  console.log("Testing with S3 URL:", s3Url);
  
  try {
    // Import services
    const services = await importServices();
    
    // Step 1: Download the image from S3
    const imageBuffer = await downloadImage(s3Url);
    console.log(`Successfully downloaded image (${imageBuffer.length} bytes)`);
    
    // Save the image locally for verification
    const localPath = path.join(__dirname, "downloaded-test-image.jpg");
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`Saved image locally to ${localPath}`);
    
    // Step 2: Test Rekognition services
    console.log("\n--- Testing Rekognition Services ---");
    
    // Test inappropriate content detection
    console.log("\nTesting inappropriate content detection...");
    try {
      const isInappropriate = await services.detectInappropriateContent(imageBuffer);
      console.log(`Is inappropriate: ${isInappropriate}`);
    } catch (error) {
      console.error("Error detecting inappropriate content:", error);
    }
    
    // Test real photo verification
    console.log("\nTesting real photo verification...");
    try {
      const isRealPhoto = await services.verifyRealPhoto(imageBuffer);
      console.log(`Is real photo: ${isRealPhoto}`);
    } catch (error) {
      console.error("Error verifying real photo:", error);
    }
    
    // Test text detection
    console.log("\nTesting text detection...");
    try {
      const detectedText = await services.detectText(imageBuffer);
      console.log("Detected text:", detectedText);
    } catch (error) {
      console.error("Error detecting text:", error);
    }
    
    // Step 3: Test Cloudinary upload
    console.log("\n--- Testing Cloudinary Services ---");
    console.log("\nTesting Cloudinary upload...");
    try {
      const cloudinaryResult = await services.uploadToCloudinary(imageBuffer, "test");
      console.log("Cloudinary upload successful!");
      console.log("Public ID:", cloudinaryResult.public_id);
      console.log("URL:", cloudinaryResult.secure_url);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
    }
    
    console.log("\n--- Test Complete ---");
    console.log("If any of the tests failed, check your AWS and Cloudinary configurations.");
    console.log("If all tests passed, your image service components are working correctly!");
    
  } catch (error) {
    console.error("Error testing with S3 URL:", error);
  }
}

// Run the test
testWithS3Url(); 