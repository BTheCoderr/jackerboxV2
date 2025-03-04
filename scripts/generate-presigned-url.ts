import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";
import { createHmac } from "crypto";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get AWS credentials from environment variables
const region = process.env.AWS_REGION || "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-images";

// Function to generate a pre-signed URL for S3 upload
function generatePresignedUrl(
  key: string,
  contentType: string = "application/octet-stream",
  expiresIn: number = 3600 // 1 hour
): string {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not set in environment variables");
  }

  // Current time
  const date = new Date();
  const dateString = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = dateString.substring(0, 8);
  const amzDate = dateString;

  // Expiration time
  const expirationDate = new Date(date.getTime() + expiresIn * 1000);
  const expiresTimestamp = Math.floor(expirationDate.getTime() / 1000);

  // Canonical request
  const method = "PUT";
  const canonicalUri = `/${key}`;
  const host = `${bucketName}.s3.${region}.amazonaws.com`;
  const canonicalQueryString = "";
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const canonicalRequestHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");

  // String to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Signing key
  const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest();
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  // Construct the URL
  const url = `https://${host}${canonicalUri}`;
  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": signedHeaders,
    "X-Amz-Signature": signature,
  });

  return `${url}?${queryParams.toString()}`;
}

// Generate a pre-signed URL for a test file
const fileName = "test-upload.txt";
const contentType = "text/plain";
const presignedUrl = generatePresignedUrl(fileName, contentType);

console.log(`Pre-signed URL for uploading ${fileName}:`);
console.log(presignedUrl);
console.log("\nYou can use this URL to upload a file using a PUT request.");
console.log("Example using curl:");
console.log(`curl -X PUT -H "Content-Type: ${contentType}" --data-binary "@scripts/test-file.txt" "${presignedUrl}"`);
console.log("\nExample using Postman:");
console.log("1. Set method to PUT");
console.log(`2. Enter the URL: ${presignedUrl}`);
console.log(`3. Set header Content-Type: ${contentType}`);
console.log("4. In the Body tab, select 'binary' and upload your file");
console.log("5. Click Send");
console.log("\nAfter uploading, the file will be accessible at:");
console.log(`https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`); 