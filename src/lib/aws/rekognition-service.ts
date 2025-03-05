import { 
  RekognitionClient, 
  DetectLabelsCommand,
  DetectModerationLabelsCommand,
  CompareFacesCommand,
  DetectTextCommand,
  TextDetection
} from "@aws-sdk/client-rekognition";
import { getAwsRegion, getAwsAccessKeyId, getAwsSecretAccessKey } from './env';

// Initialize Rekognition client
const rekognitionClient = new RekognitionClient({
  region: getAwsRegion(),
  credentials: {
    accessKeyId: getAwsAccessKeyId(),
    secretAccessKey: getAwsSecretAccessKey(),
  },
});

/**
 * Detect if an image contains inappropriate content
 * @param imageBuffer The image buffer to analyze
 * @param minConfidence The minimum confidence level (0-100)
 * @returns Whether the image contains inappropriate content
 */
export async function detectInappropriateContent(
  imageBuffer: Buffer,
  minConfidence: number = 50
): Promise<boolean> {
  const params = {
    Image: {
      Bytes: imageBuffer,
    },
    MinConfidence: minConfidence,
  };
  
  try {
    const command = new DetectModerationLabelsCommand(params);
    const response = await rekognitionClient.send(command);
    
    // If any moderation labels are found, the image contains inappropriate content
    return (response.ModerationLabels?.length || 0) > 0;
  } catch (error) {
    console.error("Error detecting inappropriate content:", error);
    throw error;
  }
}

/**
 * Compare faces between two images
 * @param sourceImageBuffer The source image buffer (ID photo)
 * @param targetImageBuffer The target image buffer (selfie)
 * @param similarityThreshold The minimum similarity threshold (0-100)
 * @returns Whether the faces match
 */
export async function compareFaces(
  sourceImageBuffer: Buffer,
  targetImageBuffer: Buffer,
  similarityThreshold: number = 80
): Promise<boolean> {
  const params = {
    SourceImage: {
      Bytes: sourceImageBuffer,
    },
    TargetImage: {
      Bytes: targetImageBuffer,
    },
    SimilarityThreshold: similarityThreshold,
  };
  
  try {
    const command = new CompareFacesCommand(params);
    const response = await rekognitionClient.send(command);
    
    // If any face matches are found, the faces match
    return (response.FaceMatches?.length || 0) > 0;
  } catch (error) {
    console.error("Error comparing faces:", error);
    throw error;
  }
}

/**
 * Detect text in an image (useful for ID verification)
 * @param imageBuffer The image buffer to analyze
 * @returns The detected text
 */
export async function detectText(imageBuffer: Buffer): Promise<string[]> {
  const params = {
    Image: {
      Bytes: imageBuffer,
    },
  };
  
  try {
    const command = new DetectTextCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Extract the detected text
    const textDetections = response.TextDetections || [];
    return textDetections
      .filter((detection: TextDetection) => detection.Type === "LINE")
      .map((detection: TextDetection) => detection.DetectedText || "")
      .filter((text: string) => text.length > 0);
  } catch (error) {
    console.error("Error detecting text:", error);
    throw error;
  }
}

/**
 * Verify if an image is a real photo (not a screenshot or digital image)
 * @param imageBuffer The image buffer to analyze
 * @returns Whether the image is likely a real photo
 */
export async function verifyRealPhoto(imageBuffer: Buffer): Promise<{
  isRealPhoto: boolean;
  quality: {
    brightness: number;
    sharpness: number;
    clarity: number;
  };
  confidence: number;
  message?: string;
}> {
  const params = {
    Image: {
      Bytes: imageBuffer,
    },
    MaxLabels: 20,
    MinConfidence: 70,
  };
  
  try {
    const command = new DetectLabelsCommand(params);
    const response = await rekognitionClient.send(command);
    
    const labels = response.Labels || [];
    
    // Enhanced photo quality indicators
    const realPhotoIndicators = [
      "Person", "Face", "Portrait", "Human", 
      "Photography", "Photo", "Camera"
    ];
    const digitalIndicators = [
      "Text", "Screenshot", "Document", 
      "Web Page", "Computer", "Screen"
    ];
    
    // Calculate confidence scores
    const realPhotoScore = labels
      .filter(label => realPhotoIndicators.includes(label.Name || ""))
      .reduce((acc, label) => acc + (label.Confidence || 0), 0) / realPhotoIndicators.length;
    
    const digitalScore = labels
      .filter(label => digitalIndicators.includes(label.Name || ""))
      .reduce((acc, label) => acc + (label.Confidence || 0), 0) / digitalIndicators.length;
    
    // Quality assessment
    const qualityLabels = labels.filter(label => 
      ["Blurry", "Dark", "Bright", "Sharp"].includes(label.Name || "")
    );
    
    const quality = {
      brightness: 100 - (qualityLabels.find(l => l.Name === "Dark")?.Confidence || 0),
      sharpness: 100 - (qualityLabels.find(l => l.Name === "Blurry")?.Confidence || 0),
      clarity: qualityLabels.find(l => l.Name === "Sharp")?.Confidence || 100,
    };
    
    const isRealPhoto = realPhotoScore > 70 && digitalScore < 50;
    const confidence = realPhotoScore;
    
    return {
      isRealPhoto,
      quality,
      confidence,
      message: isRealPhoto 
        ? "Image verified as a real photo"
        : "Image appears to be a digital creation or screenshot",
    };
  } catch (error) {
    console.error("Error verifying real photo:", error);
    throw error;
  }
} 