import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

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

async function testS3Access() {
  console.log(`Testing access to file at: ${s3Url}`);
  
  try {
    // Attempt to fetch the file
    const response = await fetch(s3Url);
    
    if (response.ok) {
      console.log(`Success! File is accessible. Status: ${response.status}`);
      console.log(`Content type: ${response.headers.get("content-type")}`);
      console.log(`Content length: ${response.headers.get("content-length")} bytes`);
      
      // Get the file content (for small files)
      if (response.headers.get("content-type")?.includes("text")) {
        const content = await response.text();
        console.log(`File content (first 100 chars): ${content.substring(0, 100)}...`);
      } else {
        console.log("File is not text-based, skipping content display.");
      }
      
      return true;
    } else {
      console.error(`Error accessing file. Status: ${response.status}`);
      console.error(`Error message: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.error("Error testing S3 access:", error);
    return false;
  }
}

// Run the test
testS3Access(); 