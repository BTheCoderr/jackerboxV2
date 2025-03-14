import { v2 as cloudinary } from 'cloudinary';
import { 
  RekognitionClient, 
  DetectTextCommand, 
  DetectLabelsCommand,
  CompareFacesCommand
} from '@aws-sdk/client-rekognition';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface IDVerificationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  documentType: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
  name: string | null;
  faceMatchConfidence?: number;
  documentAnalysisConfidence?: number;
}

/**
 * Verifies an ID document using both Cloudinary and AWS Rekognition
 * Provides enhanced document analysis and face verification
 */
export async function verifyIDDocument(
  documentImageUrl: string, 
  selfieImageUrl?: string
): Promise<IDVerificationResult> {
  try {
    // Upload document image to Cloudinary for analysis with OCR
    const uploadResult = await cloudinary.uploader.upload(documentImageUrl, {
      resource_type: 'image',
      ocr: 'adv_ocr',
      categorization: 'aws_rek_tagging',
      folder: 'id-verification',
      access_mode: 'authenticated', // Restrict access for security
    });

    // Extract OCR data from Cloudinary
    const ocrData = uploadResult.info?.ocr?.adv_ocr || {};
    const cloudinaryText = ocrData.data?.text || '';
    
    // Get the image as a buffer for AWS Rekognition
    const documentImageResponse = await fetch(uploadResult.secure_url);
    const documentImageBuffer = Buffer.from(await documentImageResponse.arrayBuffer());
    
    // Use AWS Rekognition for text detection (more accurate than Cloudinary OCR)
    const detectTextCommand = new DetectTextCommand({
      Image: { Bytes: documentImageBuffer }
    });
    const textDetectionResult = await rekognitionClient.send(detectTextCommand);
    const detectedTextItems = textDetectionResult.TextDetections || [];
    
    // Combine detected text from both services
    const awsText = detectedTextItems
      .filter(item => item.Type === 'LINE')
      .map(item => item.DetectedText || '')
      .join(' ');
    
    const combinedText = `${cloudinaryText} ${awsText}`;
    
    // Use AWS Rekognition to detect labels (to verify it's an ID document)
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: documentImageBuffer },
      MaxLabels: 20,
      MinConfidence: 70
    });
    const labelsResult = await rekognitionClient.send(detectLabelsCommand);
    const labels = labelsResult.Labels || [];
    
    // Check if the image contains an ID document
    const idDocumentLabels = labels.filter(label => 
      ['ID', 'Card', 'Document', 'License', 'Passport', 'Identification'].includes(label.Name || '')
    );
    const isIDDocument = idDocumentLabels.length > 0;
    const documentLabelConfidence = idDocumentLabels.length > 0 
      ? idDocumentLabels[0].Confidence || 0 
      : 0;
    
    // Check for common ID document patterns in the combined text
    const isPassport = /passport|travel document/i.test(combinedText);
    const isDriverLicense = /driver('s)? licen[sc]e|driving permit/i.test(combinedText);
    const isNationalID = /national id|identity card|identification/i.test(combinedText);
    
    // Determine document type
    let documentType: string | null = null;
    if (isPassport) documentType = 'passport';
    else if (isDriverLicense) documentType = 'driver_license';
    else if (isNationalID) documentType = 'national_id';
    else if (isIDDocument) documentType = 'other_id';
    
    // Extract document number (improved regex patterns)
    const documentNumberPatterns = [
      /(?:No|Number|#)[:\s]*([A-Z0-9]{5,})/i,
      /(?:ID|DL)[:\s#]*([A-Z0-9]{5,})/i,
      /(?:PASSPORT)[:\s#]*([A-Z0-9]{5,})/i
    ];
    
    let documentNumber: string | null = null;
    for (const pattern of documentNumberPatterns) {
      const match = combinedText.match(pattern);
      if (match && match[1]) {
        documentNumber = match[1];
        break;
      }
    }
    
    // Extract expiry date (improved patterns)
    const expiryDatePatterns = [
      /(?:expiry|expiration|valid until|exp)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:expiry|expiration|valid until|exp)[:\s]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
      /(?:EXP|EXPIRY)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/i
    ];
    
    let expiryDate: string | null = null;
    for (const pattern of expiryDatePatterns) {
      const match = combinedText.match(pattern);
      if (match && match[1]) {
        expiryDate = match[1];
        break;
      }
    }
    
    // Extract name (improved patterns)
    const namePatterns = [
      /(?:name|surname|given name)[:\s]*([A-Za-z\s]+)/i,
      /(?:NAME)[:\s]*([A-Za-z\s]+)/i,
      /(?:SURNAME|LAST NAME)[:\s]*([A-Za-z\s]+)/i,
      /(?:FIRST NAME|GIVEN NAME)[:\s]*([A-Za-z\s]+)/i
    ];
    
    let name: string | null = null;
    for (const pattern of namePatterns) {
      const match = combinedText.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        break;
      }
    }
    
    // Face comparison if selfie is provided
    let faceMatchConfidence = 0;
    if (selfieImageUrl) {
      try {
        // Upload selfie to Cloudinary
        const selfieUploadResult = await cloudinary.uploader.upload(selfieImageUrl, {
          resource_type: 'image',
          folder: 'id-verification-selfies',
          access_mode: 'authenticated',
        });
        
        // Get the selfie image as a buffer
        const selfieImageResponse = await fetch(selfieUploadResult.secure_url);
        const selfieImageBuffer = Buffer.from(await selfieImageResponse.arrayBuffer());
        
        // Compare faces between ID document and selfie
        const compareFacesCommand = new CompareFacesCommand({
          SourceImage: { Bytes: documentImageBuffer },
          TargetImage: { Bytes: selfieImageBuffer },
          SimilarityThreshold: 70
        });
        
        const faceComparisonResult = await rekognitionClient.send(compareFacesCommand);
        const faceMatches = faceComparisonResult.FaceMatches || [];
        
        if (faceMatches.length > 0) {
          faceMatchConfidence = faceMatches[0].Similarity || 0;
        }
      } catch (error) {
        console.error("Face comparison error:", error);
        // Continue with the verification even if face comparison fails
      }
    }
    
    // Calculate confidence based on extracted data and AWS analysis
    let confidence = 0;
    if (documentType) confidence += 0.2;
    if (documentNumber) confidence += 0.2;
    if (expiryDate) confidence += 0.1;
    if (name) confidence += 0.1;
    if (isIDDocument) confidence += 0.2;
    if (faceMatchConfidence > 0) confidence += (faceMatchConfidence / 100) * 0.2;
    
    // Determine validity
    const isValid = confidence >= 0.5;
    
    let message = isValid 
      ? "ID document verified successfully" 
      : "Could not verify ID document with confidence";
      
    if (!documentType) {
      message = "Could not determine document type. Please upload a clearer image of your ID.";
    }
    
    if (faceMatchConfidence > 0) {
      message += ` Face match confidence: ${faceMatchConfidence.toFixed(1)}%`;
    }
    
    return {
      isValid,
      message,
      confidence,
      documentType,
      documentNumber,
      expiryDate,
      name,
      faceMatchConfidence: faceMatchConfidence > 0 ? faceMatchConfidence : undefined,
      documentAnalysisConfidence: documentLabelConfidence
    };
  } catch (error) {
    console.error("ID verification error:", error);
    return {
      isValid: false,
      message: "Failed to verify ID document. Please try again.",
      confidence: 0,
      documentType: null,
      documentNumber: null,
      expiryDate: null,
      name: null
    };
  }
} 