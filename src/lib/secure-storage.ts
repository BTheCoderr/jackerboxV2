/**
 * Secure storage utilities for sensitive documents like IDs
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { log } from './monitoring';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Secure bucket name
const SECURE_BUCKET = process.env.SECURE_DOCUMENT_BUCKET || 'secure-documents';

// Document encryption key from environment (should be long and complex)
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || 'default-dev-key-not-for-production';

/**
 * Encrypt data before storing it
 * @param data The data to encrypt
 * @returns The encrypted data and IV
 */
function encryptData(data: Buffer): { encryptedData: Buffer; iv: Buffer } {
  // Create a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create a cipher using AES-256-CBC
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  // Encrypt the data
  const encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  return { encryptedData, iv };
}

/**
 * Decrypt data retrieved from storage
 * @param encryptedData The encrypted data
 * @param iv The initialization vector
 * @returns The decrypted data
 */
function decryptData(encryptedData: Buffer, iv: Buffer): Buffer {
  // Create a decipher using AES-256-CBC
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  // Decrypt the data
  const decryptedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
  
  return decryptedData;
}

/**
 * Generate a secure key for storing documents
 * @param userId The user ID
 * @param documentType The type of document
 * @returns A secure storage key
 */
function generateSecureKey(userId: string, documentType: string): string {
  // Create a random component to prevent guessing
  const randomComponent = crypto.randomBytes(8).toString('hex');
  
  // Create a deterministic component based on user ID
  const hashedUserId = crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex')
    .substring(0, 16);
  
  // Combine components for the final key
  return `${documentType}/${hashedUserId}/${randomComponent}`;
}

/**
 * Store a document securely
 * @param userId The user ID
 * @param documentType The type of document (id, passport, etc.)
 * @param data The document data
 * @returns The document ID for later retrieval
 */
export async function storeSecureDocument(
  userId: string,
  documentType: string,
  data: Buffer
): Promise<string> {
  try {
    // Encrypt the data
    const { encryptedData, iv } = encryptData(data);
    
    // Generate a secure storage key
    const documentId = generateSecureKey(userId, documentType);
    
    // Store the IV in the metadata
    const metadata = {
      'x-amz-meta-initialization-vector': iv.toString('base64'),
      'x-amz-meta-user-id': userId, // Store user ID for audit purposes
      'x-amz-meta-document-type': documentType,
      'x-amz-meta-upload-date': new Date().toISOString(),
    };
    
    // Upload to S3 with server-side encryption
    await s3Client.send(
      new PutObjectCommand({
        Bucket: SECURE_BUCKET,
        Key: documentId,
        Body: encryptedData,
        Metadata: metadata,
        ContentType: 'application/octet-stream',
        ServerSideEncryption: 'AES256', // Use S3's server-side encryption as an additional layer
      })
    );
    
    log.info('Secure document stored', {
      userId,
      documentType,
      documentId: documentId.split('/').pop() // Log only the random part
    });
    
    return documentId;
  } catch (error) {
    log.error('Failed to store secure document', {
      userId,
      documentType,
      error: (error as Error).message
    });
    
    throw new Error('Failed to store document securely');
  }
}

/**
 * Retrieve a document securely
 * @param documentId The document ID returned from storeSecureDocument
 * @returns The decrypted document data
 */
export async function retrieveSecureDocument(documentId: string): Promise<Buffer> {
  try {
    // Get the object from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: SECURE_BUCKET,
        Key: documentId,
      })
    );
    
    // Get the encrypted data
    const encryptedData = await response.Body?.transformToByteArray();
    
    if (!encryptedData) {
      throw new Error('Document data is empty');
    }
    
    // Get the IV from metadata
    const ivBase64 = response.Metadata?.['initialization-vector'];
    
    if (!ivBase64) {
      throw new Error('Missing initialization vector in metadata');
    }
    
    // Decrypt the data
    const iv = Buffer.from(ivBase64, 'base64');
    const decryptedData = decryptData(Buffer.from(encryptedData), iv);
    
    // Log access for audit purposes
    log.info('Secure document retrieved', {
      documentId: documentId.split('/').pop(),
      userId: response.Metadata?.['user-id'],
      documentType: response.Metadata?.['document-type'],
    });
    
    return decryptedData;
  } catch (error) {
    log.error('Failed to retrieve secure document', {
      documentId,
      error: (error as Error).message
    });
    
    throw new Error('Failed to retrieve document securely');
  }
}

/**
 * Generate a time-limited URL for accessing a document
 * @param documentId The document ID
 * @param expiresInMinutes How long the URL should be valid (default: 10 minutes)
 * @returns A signed URL that will expire
 */
export async function generateSecureDocumentUrl(
  documentId: string,
  expiresInMinutes: number = 10
): Promise<string> {
  try {
    // Create a presigned URL that expires
    const command = new GetObjectCommand({
      Bucket: SECURE_BUCKET,
      Key: documentId,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInMinutes * 60, // Convert to seconds
    });
    
    log.info('Generated secure document URL', {
      documentId: documentId.split('/').pop(),
      expiresInMinutes,
    });
    
    return signedUrl;
  } catch (error) {
    log.error('Failed to generate secure document URL', {
      documentId,
      error: (error as Error).message
    });
    
    throw new Error('Failed to generate secure document URL');
  }
}

/**
 * Delete a document securely
 * @param documentId The document ID
 */
export async function deleteSecureDocument(documentId: string): Promise<void> {
  try {
    // Delete the object from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: SECURE_BUCKET,
        Key: documentId,
      })
    );
    
    log.info('Secure document deleted', {
      documentId: documentId.split('/').pop(),
    });
  } catch (error) {
    log.error('Failed to delete secure document', {
      documentId,
      error: (error as Error).message
    });
    
    throw new Error('Failed to delete document securely');
  }
} 