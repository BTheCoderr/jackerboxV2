import Tesseract from 'tesseract.js';
import { createWorker } from 'tesseract.js';

export interface BasicIDVerificationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  documentType: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
  name: string | null;
  needsManualReview: boolean;
  extractedText: string;
}

/**
 * Performs basic ID verification using Tesseract OCR
 * This is a cost-effective alternative to paid verification services
 */
export async function verifyIDDocumentBasic(imageBuffer: Buffer): Promise<BasicIDVerificationResult> {
  try {
    // Convert buffer to base64 for Tesseract
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Create Tesseract worker
    const worker = await createWorker();
    
    // Initialize worker with English language
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Recognize text in the image
    const { data } = await worker.recognize(base64Image);
    const extractedText = data.text;
    
    // Terminate worker
    await worker.terminate();
    
    // Check for common ID document patterns
    const isPassport = /passport|travel document/i.test(extractedText);
    const isDriverLicense = /driver('s)? licen[sc]e|driving permit/i.test(extractedText);
    const isNationalID = /national id|identity card|identification/i.test(extractedText);
    
    // Determine document type
    let documentType = null;
    if (isPassport) documentType = 'passport';
    else if (isDriverLicense) documentType = 'driver_license';
    else if (isNationalID) documentType = 'national_id';
    
    // Extract document number (simplified approach)
    const documentNumberMatch = extractedText.match(/(?:No|Number|#)[:\s]*([A-Z0-9]+)/i);
    const documentNumber = documentNumberMatch ? documentNumberMatch[1] : null;
    
    // Extract expiry date (simplified)
    const expiryDateMatch = extractedText.match(/(?:expiry|expiration|valid until)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    const expiryDate = expiryDateMatch ? expiryDateMatch[1] : null;
    
    // Extract name (simplified)
    const nameMatch = extractedText.match(/(?:name|surname|given name)[:\s]*([A-Za-z\s]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : null;
    
    // Calculate confidence based on extracted data
    let confidence = 0;
    if (documentType) confidence += 0.3;
    if (documentNumber) confidence += 0.3;
    if (expiryDate) confidence += 0.2;
    if (name) confidence += 0.2;
    
    // Determine if manual review is needed
    const needsManualReview = confidence < 0.7;
    
    // Determine validity - we'll be conservative and require manual review for low confidence
    const isValid = confidence >= 0.5;
    
    let message = isValid 
      ? needsManualReview 
        ? "ID document submitted for manual review" 
        : "ID document verified successfully"
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
      name,
      needsManualReview,
      extractedText
    };
  } catch (error) {
    console.error("Basic ID verification error:", error);
    return {
      isValid: false,
      message: "Failed to verify ID document. Please try again.",
      confidence: 0,
      documentType: null,
      documentNumber: null,
      expiryDate: null,
      name: null,
      needsManualReview: true,
      extractedText: ""
    };
  }
} 