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

// Get the S3 bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-image";
const region = process.env.AWS_REGION || "us-east-2";

// Test file name - this should be a file you've manually uploaded to your S3 bucket
const testFileName = "test-image.jpg"; // Change this to match a file you've uploaded

// Construct the S3 URL
const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${testFileName}`;

/**
 * Simple test to download an image from S3
 */
async function testS3Direct() {
  console.log("Testing direct S3 access with URL:", s3Url);
  
  try {
    // Attempt to fetch the file
    const response = await fetch(s3Url);
    
    if (!response.ok) {
      console.error(`Failed to access S3 file: ${response.status} ${response.statusText}`);
      console.error("Response headers:", response.headers);
      
      // Try to read the error response body
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      return;
    }
    
    // If successful, save the file locally
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`Successfully downloaded image (${imageBuffer.length} bytes)`);
    
    // Save the image locally for verification
    const localPath = path.join(__dirname, "downloaded-test-image.jpg");
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`Saved image locally to ${localPath}`);
    
    console.log("S3 direct access test successful!");
  } catch (error) {
    console.error("Error testing direct S3 access:", error);
  }
}

// Run the test
testS3Direct(); 