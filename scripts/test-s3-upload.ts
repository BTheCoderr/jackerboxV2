import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Log the credentials being used (without revealing the full secret)
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS Secret Access Key (first 4 chars):", process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 4));
console.log("S3 Bucket Name:", process.env.AWS_S3_BUCKET_NAME);

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Test file path
const testFilePath = path.join(__dirname, 'test-file.txt');

// Create a test file if it doesn't exist
if (!fs.existsSync(testFilePath)) {
  fs.writeFileSync(testFilePath, 'This is a test file for S3 upload.');
  console.log(`Created test file at ${testFilePath}`);
}

async function testS3Upload() {
  try {
    console.log("Testing S3 upload...");
    
    // Read the test file
    const fileContent = fs.readFileSync(testFilePath);
    
    // Upload the file to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "jackerbox-images",
      Key: 'test-file.txt',
      Body: fileContent,
      ContentType: 'text/plain',
    });
    
    const response = await s3Client.send(command);
    
    console.log("Success! File uploaded to S3.");
    console.log("Response:", response);
    
  } catch (error) {
    console.error("Error uploading to S3:", error);
    process.exit(1);
  }
}

// Run the test
testS3Upload();