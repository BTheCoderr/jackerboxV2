import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { 
  S3Client, 
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  BucketLocationConstraint
} from "@aws-sdk/client-s3";

// Load environment variables
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get AWS credentials from environment variables
const region = process.env.AWS_REGION || "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-images";

// Initialize S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Create an S3 bucket with the correct permissions
 */
async function createS3Bucket() {
  console.log(`Creating S3 bucket: ${bucketName} in region ${region}`);
  console.log(`Using AWS credentials: Access Key ID: ${accessKeyId.substring(0, 5)}...`);
  
  try {
    // Step 1: Create the bucket
    console.log("\nStep 1: Creating bucket...");
    const createBucketParams = {
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region as BucketLocationConstraint
      }
    };
    
    const createBucketResponse = await s3Client.send(new CreateBucketCommand(createBucketParams));
    console.log("Bucket created successfully:", createBucketResponse);
    
    // Step 2: Configure public access block settings
    console.log("\nStep 2: Configuring public access block settings...");
    const publicAccessBlockParams = {
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    };
    
    const publicAccessBlockResponse = await s3Client.send(new PutPublicAccessBlockCommand(publicAccessBlockParams));
    console.log("Public access block settings configured successfully:", publicAccessBlockResponse);
    
    // Step 3: Configure CORS
    console.log("\nStep 3: Configuring CORS...");
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };
    
    const corsResponse = await s3Client.send(new PutBucketCorsCommand(corsParams));
    console.log("CORS configured successfully:", corsResponse);
    
    // Step 4: Set bucket policy for public read access
    console.log("\nStep 4: Setting bucket policy for public read access...");
    const policyParams = {
      Bucket: bucketName,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${bucketName}/*`
          }
        ]
      })
    };
    
    const policyResponse = await s3Client.send(new PutBucketPolicyCommand(policyParams));
    console.log("Bucket policy set successfully:", policyResponse);
    
    console.log("\nS3 bucket created and configured successfully!");
    console.log(`Bucket URL: https://${bucketName}.s3.${region}.amazonaws.com/`);
    console.log("\nNext steps:");
    console.log("1. Upload a test image to the bucket using the AWS console or CLI");
    console.log("2. Run 'npm run test-s3-direct' to verify access to the bucket");
    
  } catch (error) {
    console.error("Error creating S3 bucket:", error);
  }
}

// Run the function
createS3Bucket(); 