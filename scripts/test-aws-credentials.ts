import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log the credentials being used (without revealing the full secret)
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS Secret Access Key (first 4 chars):", process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 4));

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function testAwsCredentials() {
  try {
    console.log("Testing AWS credentials by listing S3 buckets...");
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log("Success! Your AWS credentials are working.");
    console.log("Your S3 buckets:", response.Buckets?.map(bucket => bucket.Name).join(", ") || "No buckets found");
  } catch (error) {
    console.error("Error testing AWS credentials:", error);
    process.exit(1);
  }
}

// Run the test
testAwsCredentials(); 