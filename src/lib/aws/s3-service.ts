import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  S3ServiceException
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

// Custom error class for S3 operations
export class S3Error extends Error {
  statusCode?: number;
  requestId?: string;
  
  constructor(message: string, statusCode?: number, requestId?: string) {
    super(message);
    this.name = 'S3Error';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || "jackerbox-image";
const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;

/**
 * Get the public URL for an S3 object
 * @param key The S3 key of the object
 * @returns The public URL (using CloudFront if available)
 */
export function getPublicS3Url(key: string): string {
  // Use CloudFront if available
  if (cloudFrontDomain) {
    return `https://${cloudFrontDomain}/${key}`;
  }
  
  // Fall back to direct S3 URL
  return `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;
}

/**
 * Upload a file to S3
 * @param file The file buffer to upload
 * @param contentType The content type of the file
 * @param folder Optional folder path within the bucket
 * @param filename Optional custom filename (default: generated UUID)
 * @returns The S3 key and public URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer,
  contentType: string,
  folder: string = "uploads",
  filename?: string
): Promise<{ key: string; url: string }> {
  try {
    const fileKey = filename || `${uuidv4()}-${Date.now()}`;
    const key = folder ? `${folder}/${fileKey}` : fileKey;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };
    
    const result = await s3Client.send(new PutObjectCommand(params));
    
    return {
      key,
      url: getPublicS3Url(key)
    };
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error uploading to S3:", s3Error);
    throw new S3Error(
      `Failed to upload file to S3: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Generate a signed URL for uploading a file to S3
 * @param key The S3 key to use for the upload
 * @param contentType The content type of the file
 * @param expiresIn The expiration time in seconds (default: 300 - 5 minutes)
 * @returns The signed upload URL
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };
    
    const command = new PutObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error generating signed upload URL:", s3Error);
    throw new S3Error(
      `Failed to generate signed upload URL: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Generate a signed URL for downloading an S3 object
 * @param key The S3 key of the object
 * @param expiresIn The expiration time in seconds (default: 3600 - 1 hour)
 * @returns The signed download URL
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    
    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error generating signed download URL:", s3Error);
    throw new S3Error(
      `Failed to generate signed download URL: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Check if an object exists in S3
 * @param key The S3 key of the object
 * @returns Boolean indicating if the object exists
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    
    await s3Client.send(new HeadObjectCommand(params));
    return true;
  } catch (error) {
    if ((error as S3ServiceException).$metadata?.httpStatusCode === 404) {
      return false;
    }
    const s3Error = error as S3ServiceException;
    console.error("Error checking if object exists:", s3Error);
    throw new S3Error(
      `Failed to check if object exists: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * List objects in an S3 folder
 * @param prefix The folder prefix to list
 * @param maxKeys Maximum number of keys to return (default: 1000)
 * @returns Array of object keys
 */
export async function listObjects(
  prefix: string = "",
  maxKeys: number = 1000
): Promise<string[]> {
  try {
    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys
    };
    
    const result = await s3Client.send(new ListObjectsV2Command(params));
    return (result.Contents || []).map(item => item.Key || "");
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error listing objects:", s3Error);
    throw new S3Error(
      `Failed to list objects: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Copy an object within S3
 * @param sourceKey The source S3 key
 * @param destinationKey The destination S3 key
 * @returns The ETag of the new object
 */
export async function copyObject(
  sourceKey: string,
  destinationKey: string
): Promise<string | undefined> {
  try {
    const params = {
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };
    
    const result = await s3Client.send(new CopyObjectCommand(params));
    
    // If using CloudFront, invalidate the cache for the new object
    if (cloudFrontDomain && process.env.CLOUDFRONT_DISTRIBUTION_ID) {
      await invalidateCloudFrontCache([`/${destinationKey}`]);
    }
    
    return result.CopyObjectResult?.ETag;
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error copying object:", s3Error);
    throw new S3Error(
      `Failed to copy object: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Delete an object from S3
 * @param key The S3 key of the object to delete
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    
    await s3Client.send(new DeleteObjectCommand(params));
    
    // If using CloudFront, invalidate the cache for the deleted object
    if (cloudFrontDomain && process.env.CLOUDFRONT_DISTRIBUTION_ID) {
      await invalidateCloudFrontCache([`/${key}`]);
    }
  } catch (error) {
    const s3Error = error as S3ServiceException;
    console.error("Error deleting from S3:", s3Error);
    throw new S3Error(
      `Failed to delete object: ${s3Error.message}`,
      s3Error.$metadata?.httpStatusCode,
      s3Error.$metadata?.requestId
    );
  }
}

/**
 * Invalidate CloudFront cache for specific paths
 * @param paths Array of paths to invalidate (e.g., ['/images/*'])
 */
export async function invalidateCloudFrontCache(paths: string[]): Promise<void> {
  if (!cloudFrontDomain || !process.env.CLOUDFRONT_DISTRIBUTION_ID) {
    return;
  }
  
  try {
    // This is a placeholder for actual CloudFront invalidation
    // In a real implementation, you would use the CloudFront client to create an invalidation
    console.log(`CloudFront invalidation for paths: ${paths.join(', ')}`);
    console.log(`Run: aws cloudfront create-invalidation --distribution-id ${process.env.CLOUDFRONT_DISTRIBUTION_ID} --paths "${paths.join(' ')}"`);
  } catch (error) {
    console.error("Error invalidating CloudFront cache:", error);
  }
} 