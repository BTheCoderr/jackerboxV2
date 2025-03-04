import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface IDVerificationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  documentType: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
  name: string | null;
}

/**
 * Verifies an ID document using Cloudinary's AI capabilities
 * Checks for document type, validity, and extracts information
 */
export async function verifyIDDocument(imageUrl: string): Promise<IDVerificationResult> {
  try {
    // Upload image to Cloudinary for analysis with OCR
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      ocr: 'adv_ocr',
      categorization: 'aws_rek_tagging',
      folder: 'id-verification',
      access_mode: 'authenticated', // Restrict access for security
    });

    // Extract OCR data
    const ocrData = uploadResult.info?.ocr?.adv_ocr || {};
    const text = ocrData.data?.text || '';
    
    // Check for common ID document patterns
    const isPassport = /passport|travel document/i.test(text);
    const isDriverLicense = /driver('s)? licen[sc]e|driving permit/i.test(text);
    const isNationalID = /national id|identity card|identification/i.test(text);
    
    // Determine document type
    let documentType = null;
    if (isPassport) documentType = 'passport';
    else if (isDriverLicense) documentType = 'driver_license';
    else if (isNationalID) documentType = 'national_id';
    
    // Extract document number (this is a simplified approach)
    const documentNumberMatch = text.match(/(?:No|Number|#)[:\s]*([A-Z0-9]+)/i);
    const documentNumber = documentNumberMatch ? documentNumberMatch[1] : null;
    
    // Extract expiry date (simplified)
    const expiryDateMatch = text.match(/(?:expiry|expiration|valid until)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    const expiryDate = expiryDateMatch ? expiryDateMatch[1] : null;
    
    // Extract name (simplified)
    const nameMatch = text.match(/(?:name|surname|given name)[:\s]*([A-Za-z\s]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : null;
    
    // Calculate confidence based on extracted data
    let confidence = 0;
    if (documentType) confidence += 0.3;
    if (documentNumber) confidence += 0.3;
    if (expiryDate) confidence += 0.2;
    if (name) confidence += 0.2;
    
    // Determine validity
    const isValid = confidence >= 0.5;
    
    let message = isValid 
      ? "ID document verified successfully" 
      : "Could not verify ID document with confidence";
      
    if (!documentType) {
      message = "Could not determine document type. Please upload a clearer image of your ID.";
    }
    
    return {
      isValid,
      message,
      confidence,
      documentType,
      documentNumber,
      expiryDate,
      name
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