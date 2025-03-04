import { 
  S3Client, 
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand
} from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-images";

async function setupS3Bucket() {
  try {
    // Step 1: Create the bucket
    console.log(`Creating S3 bucket: ${bucketName}...`);
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );
    console.log(`S3 bucket created successfully!`);

    // Step 2: Configure CORS for the bucket
    console.log(`Configuring CORS for bucket: ${bucketName}...`);
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedOrigins: ["*"], // In production, restrict this to your domain
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      })
    );
    console.log(`CORS configuration applied successfully!`);

    // Step 3: Set bucket policy for public read access
    console.log(`Setting bucket policy for: ${bucketName}...`);
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy),
      })
    );
    console.log(`Bucket policy set successfully!`);

    console.log(`S3 bucket ${bucketName} is now fully configured and ready to use!`);
  } catch (error) {
    console.error("Error setting up S3 bucket:", error);
    process.exit(1);
  }
}

// Run the setup
setupS3Bucket(); 