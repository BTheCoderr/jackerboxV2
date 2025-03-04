import { uploadToS3, deleteFromS3 } from './aws/s3-service';
import { 
  detectInappropriateContent, 
  compareFaces, 
  detectText, 
  verifyRealPhoto 
} from './aws/rekognition-service';
import { 
  uploadToCloudinary, 
  getCloudinaryUrl, 
  deleteFromCloudinary 
} from './cloudinary-service';

export interface ProcessImageResult {
  isValid: boolean;
  s3Key?: string;
  cloudinaryId?: string;
  cloudinaryUrl?: string;
  message?: string;
  quality?: {
    brightness: number;
    sharpness: number;
    clarity: number;
  };
  confidence?: number;
}

/**
 * Process and store an image using the full pipeline:
 * 1. Store raw image in S3
 * 2. Verify image with Rekognition
 * 3. Optimize and deliver via Cloudinary
 * 
 * @param imageBuffer The image buffer to process
 * @param contentType The content type of the image
 * @param folder The folder to store the image in
 * @param preset The preset to use for Cloudinary
 * @returns The processed image result
 */
export async function processImage(
  imageBuffer: Buffer,
  contentType: string,
  folder: string = 'uploads',
  preset: 'equipment' | 'profile' | 'id' = 'equipment'
): Promise<ProcessImageResult> {
  try {
    // Step 1: Check if the image is appropriate
    const isInappropriate = await detectInappropriateContent(imageBuffer);
    if (isInappropriate) {
      return {
        isValid: false,
        message: 'Image contains inappropriate content',
      };
    }
    
    // Step 2: Check if it's a real photo and get quality metrics
    const photoVerification = await verifyRealPhoto(imageBuffer);
    if (!photoVerification.isRealPhoto) {
      return {
        isValid: false,
        message: photoVerification.message,
        quality: photoVerification.quality,
        confidence: photoVerification.confidence
      };
    }

    // Step 3: Check if the image quality meets our standards
    const { quality } = photoVerification;
    const qualityThresholds = {
      brightness: 60,
      sharpness: 70,
      clarity: 75
    };

    if (quality.brightness < qualityThresholds.brightness ||
        quality.sharpness < qualityThresholds.sharpness ||
        quality.clarity < qualityThresholds.clarity) {
      return {
        isValid: false,
        message: 'Image quality does not meet our standards. Please upload a clearer, well-lit photo.',
        quality,
        confidence: photoVerification.confidence
      };
    }
    
    // Step 4: Upload raw image to S3 for storage and record-keeping
    const s3Result = await uploadToS3(imageBuffer, contentType, folder);
    const s3Key = s3Result.key;
    
    // Step 5: Upload to Cloudinary with the appropriate preset
    const cloudinaryResult = await uploadToCloudinary(imageBuffer, folder, undefined, preset);
    
    return {
      isValid: true,
      s3Key,
      cloudinaryId: cloudinaryResult.public_id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      quality,
      confidence: photoVerification.confidence
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      isValid: false,
      message: 'Error processing image',
    };
  }
}

/**
 * Verify ID document and selfie match
 * @param idImageBuffer The ID document image buffer
 * @param selfieImageBuffer The selfie image buffer
 * @returns The verification result
 */
export async function verifyIdentity(
  idImageBuffer: Buffer,
  selfieImageBuffer: Buffer
): Promise<{
  isVerified: boolean;
  faceMatch?: boolean;
  isRealPhoto?: boolean;
  extractedText?: string[];
  message?: string;
}> {
  try {
    // Step 1: Check if the selfie is a real photo
    const isRealPhoto = await verifyRealPhoto(selfieImageBuffer);
    if (!isRealPhoto) {
      return {
        isVerified: false,
        isRealPhoto: false,
        message: 'Selfie does not appear to be a real photo',
      };
    }
    
    // Step 2: Compare faces between ID and selfie
    const faceMatch = await compareFaces(idImageBuffer, selfieImageBuffer);
    if (!faceMatch) {
      return {
        isVerified: false,
        faceMatch: false,
        isRealPhoto: true,
        message: 'Face in selfie does not match face on ID',
      };
    }
    
    // Step 3: Extract text from ID for additional verification
    const extractedText = await detectText(idImageBuffer);
    
    return {
      isVerified: true,
      faceMatch: true,
      isRealPhoto: true,
      extractedText,
    };
  } catch (error) {
    console.error('Error verifying identity:', error);
    return {
      isVerified: false,
      message: 'Error verifying identity',
    };
  }
}

/**
 * Delete an image from both S3 and Cloudinary
 * @param s3Key The S3 key of the image
 * @param cloudinaryId The Cloudinary public ID of the image
 */
export async function deleteImage(
  s3Key: string,
  cloudinaryId: string
): Promise<void> {
  try {
    // Delete from both services in parallel
    await Promise.all([
      deleteFromS3(s3Key),
      deleteFromCloudinary(cloudinaryId),
    ]);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
} 