import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Log the AWS credentials being used
console.log("AWS Credentials Check (Simple Version):");
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Set (first 4 chars): " + process.env.AWS_SECRET_ACCESS_KEY.substring(0, 4) : "Not set");

// Initialize the S3 client using credential provider
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: fromEnv(),
});

async function testAwsSimple() {
  try {
    console.log("\nAttempting to list S3 buckets with simplified configuration...");
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log("\nSuccess! AWS credentials are valid.");
    console.log("Available buckets:");
    response.Buckets?.forEach((bucket) => {
      console.log(`- ${bucket.Name} (created: ${bucket.CreationDate})`);
    });
    
    return true;
  } catch (error) {
    console.error("\nError with simplified AWS test:", error);
    
    // Try to create a test file to verify file system access
    try {
      const fs = await import("fs");
      const testFilePath = path.join(__dirname, "aws-test-file.txt");
      fs.writeFileSync(testFilePath, "This is a test file to verify file system access.");
      console.log(`\nSuccessfully created test file at ${testFilePath}`);
    } catch (fsError) {
      console.error("Error creating test file:", fsError);
    }
    
    return false;
  }
}

// Run the test
testAwsSimple(); 