import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ImageVerificationResult {
  isValid: boolean;
  message: string;
  tags: string[];
  quality: number;
  isBlurry: boolean;
  isProfessional: boolean;
  containsEquipment: boolean;
}

/**
 * Verifies an image using Cloudinary's AI capabilities
 * Checks for image quality, content, and appropriateness
 */
export async function verifyImage(imageUrl: string): Promise<ImageVerificationResult> {
  try {
    // Upload image to Cloudinary for analysis
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      categorization: 'aws_rek_tagging',
      auto_tagging: 0.7, // Confidence threshold for auto-tagging
      quality_analysis: true,
    });

    // Extract relevant information from the result
    const { tags, quality_analysis, width, height } = uploadResult;
    
    // Check if image is of sufficient quality
    const quality = quality_analysis?.quality_score || 0;
    const isBlurry = quality_analysis?.focus < 0.5;
    
    // Check if image is of sufficient size
    const isSufficientSize = width >= 800 && height >= 600;
    
    // Check if image contains equipment (based on tags)
    const equipmentRelatedTags = [
      'equipment', 'tool', 'device', 'machine', 'camera', 'electronic', 
      'hardware', 'instrument', 'appliance', 'gear', 'gadget'
    ];
    
    const containsEquipment = tags?.some(tag => 
      equipmentRelatedTags.some(eqTag => tag.toLowerCase().includes(eqTag))
    ) || false;
    
    // Determine if the image appears professional
    const isProfessional = quality > 0.7 && !isBlurry;
    
    // Overall validation
    const isValid = isSufficientSize && quality > 0.5 && !isBlurry && containsEquipment;
    
    let message = isValid 
      ? "Image verified successfully" 
      : "Image does not meet quality requirements";
      
    if (!isSufficientSize) {
      message = "Image resolution is too low. Please upload a larger image.";
    } else if (quality <= 0.5) {
      message = "Image quality is too low. Please upload a clearer image.";
    } else if (isBlurry) {
      message = "Image is blurry. Please upload a clearer image.";
    } else if (!containsEquipment) {
      message = "Image does not appear to contain equipment. Please upload relevant images.";
    }
    
    return {
      isValid,
      message,
      tags: tags || [],
      quality,
      isBlurry,
      isProfessional,
      containsEquipment
    };
  } catch (error) {
    console.error("Image verification error:", error);
    return {
      isValid: false,
      message: "Failed to verify image. Please try again.",
      tags: [],
      quality: 0,
      isBlurry: true,
      isProfessional: false,
      containsEquipment: false
    };
  }
}

/**
 * Batch verifies multiple images
 */
export async function verifyImages(imageUrls: string[]): Promise<{
  allValid: boolean;
  results: ImageVerificationResult[];
  validCount: number;
}> {
  const results = await Promise.all(
    imageUrls.map(url => verifyImage(url))
  );
  
  const validCount = results.filter(r => r.isValid).length;
  const allValid = validCount === imageUrls.length;
  
  return {
    allValid,
    results,
    validCount
  };
} 