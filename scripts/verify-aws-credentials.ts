import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Log the AWS credentials being used
console.log("AWS Credentials Check:");
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Set (first 4 chars): " + process.env.AWS_SECRET_ACCESS_KEY.substring(0, 4) : "Not set");

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function verifyAwsCredentials() {
  try {
    console.log("\nAttempting to list S3 buckets to verify credentials...");
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log("\nSuccess! AWS credentials are valid.");
    console.log("Available buckets:");
    response.Buckets?.forEach((bucket) => {
      console.log(`- ${bucket.Name} (created: ${bucket.CreationDate})`);
    });
    
    return true;
  } catch (error) {
    console.error("\nError verifying AWS credentials:", error);
    console.log("\nPossible solutions:");
    console.log("1. Check if your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct in your .env file");
    console.log("2. Ensure the IAM user has the necessary permissions (AmazonS3FullAccess)");
    console.log("3. Try creating a new access key in the AWS IAM console");
    console.log("4. Check if there are any special characters in your secret key that might need proper escaping");
    return false;
  }
}

// Run the verification
verifyAwsCredentials(); 