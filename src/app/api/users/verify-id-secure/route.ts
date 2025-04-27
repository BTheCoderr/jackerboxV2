import { NextResponse } from 'next/server';
import { storeSecureDocument, generateSecureDocumentUrl } from '@/lib/secure-storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { log, trackApiRequest, recordError } from '@/lib/monitoring';
import { createWorker } from 'tesseract.js';

/**
 * Enhanced ID verification API with secure document storage and OCR validation
 */
export async function POST(request: Request) {
  // Track API performance
  const tracker = trackApiRequest(request, 'POST /api/users/verify-id-secure');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse form data with ID image
    const formData = await request.formData();
    const idImage = formData.get('idImage') as File;
    const idType = formData.get('idType') as string || 'government_id';
    
    if (!idImage) {
      return NextResponse.json(
        { error: 'ID image is required' },
        { status: 400 }
      );
    }
    
    // Log the verification attempt
    log.info(`ID verification attempt`, {
      userId: session.user.id,
      idType,
      fileName: idImage.name,
      fileSize: idImage.size,
    });
    
    // Convert file to buffer for processing
    const imageBuffer = Buffer.from(await idImage.arrayBuffer());
    
    // Perform basic OCR to extract text from ID for verification
    const worker = await createWorker('eng');
    
    // Set page segmentation mode to treat the image as a single block of text
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
    });
    
    // Recognize text from the image
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    // Perform basic validation on the extracted text
    const validationResults = validateIdText(text, idType);
    
    // Store the ID image securely using our secure storage utility
    const documentId = await storeSecureDocument(
      session.user.id,
      idType,
      imageBuffer
    );
    
    // Create a time-limited URL for admin verification (expires in 60 minutes)
    const secureUrl = await generateSecureDocumentUrl(documentId, 60);
    
    // Update user verification status in database
    await db.user.update({
      where: { id: session.user.id },
      data: {
        verificationStatus: 'pending',
        verificationDocumentId: documentId,
        updatedAt: new Date(),
      },
    });
    
    // Also create a verification request record
    await db.verificationRequest.create({
      data: {
        userId: session.user.id,
        type: idType,
        status: 'pending',
        documentId,
        extractedText: text,
        confidenceScore: validationResults.confidenceScore,
        notes: validationResults.notes,
      },
    });
    
    // End performance tracking
    tracker.end({ status: 'success' });
    
    // Return success response with validation information
    return NextResponse.json({
      success: true,
      message: 'ID verification submitted successfully',
      status: 'pending',
      documentId,
      validationResults: {
        confidence: validationResults.confidenceScore,
        textLength: text.length,
        detectedFields: validationResults.detectedFields,
      },
    });
    
  } catch (error) {
    // Record the error
    recordError(error as Error, {
      endpoint: '/api/users/verify-id-secure',
      method: 'POST',
    });
    
    // End performance tracking with error
    tracker.end({ status: 'error' });
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to process ID verification' },
      { status: 500 }
    );
  }
}

/**
 * Admin endpoint to approve or reject verification
 */
export async function PUT(request: Request) {
  const tracker = trackApiRequest(request, 'PUT /api/users/verify-id-secure');
  
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { userId, approved, notes } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Update user verification status
    await db.user.update({
      where: { id: userId },
      data: {
        verificationStatus: approved ? 'verified' : 'rejected',
        verified: approved,
        updatedAt: new Date(),
      },
    });
    
    // Update the verification request
    await db.verificationRequest.updateMany({
      where: { 
        userId,
        status: 'pending'
      },
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        notes: notes || undefined,
      },
    });
    
    // Log the admin action
    log.info(`ID verification ${approved ? 'approved' : 'rejected'}`, {
      adminId: session.user.id,
      userId,
      notes,
    });
    
    // End performance tracking
    tracker.end({ status: 'success' });
    
    return NextResponse.json({
      success: true,
      message: `User verification ${approved ? 'approved' : 'rejected'}`
    });
    
  } catch (error) {
    // Record the error
    recordError(error as Error, {
      endpoint: '/api/users/verify-id-secure',
      method: 'PUT',
    });
    
    // End performance tracking with error
    tracker.end({ status: 'error' });
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to update verification status' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate ID text
 */
function validateIdText(text: string, idType: string): {
  confidenceScore: number;
  detectedFields: string[];
  notes: string;
} {
  // Default result
  const result = {
    confidenceScore: 0,
    detectedFields: [] as string[],
    notes: '',
  };
  
  // Very basic validation
  if (!text || text.length < 20) {
    result.notes = 'Insufficient text extracted from ID';
    return result;
  }
  
  // Check for common ID fields based on type
  const fieldPatterns: Record<string, Record<string, RegExp>> = {
    government_id: {
      name: /name|full name|surname|given name/i,
      dob: /birth|dob|born|date of birth/i,
      idNumber: /id number|identification|license|number/i,
      expiration: /expir|valid until|exp|expiration/i,
      address: /address|street|city|state|zip/i,
    },
    passport: {
      name: /name|surname|given name/i,
      nationality: /nation|country/i,
      passportNumber: /passport|document|number/i,
      dob: /birth|dob|born|date of birth/i,
      expiration: /expir|valid until|exp|expiration/i,
    },
  };
  
  // Use the correct set of patterns based on ID type
  const patterns = fieldPatterns[idType as keyof typeof fieldPatterns] || fieldPatterns.government_id;
  
  // Check text for each pattern
  let matchCount = 0;
  for (const [field, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      matchCount++;
      result.detectedFields.push(field);
    }
  }
  
  // Calculate confidence based on field matches
  const totalFields = Object.keys(patterns).length;
  result.confidenceScore = Math.min(100, Math.round((matchCount / totalFields) * 100));
  
  // Add notes based on confidence
  if (result.confidenceScore < 30) {
    result.notes = 'Low confidence - manual review required';
  } else if (result.confidenceScore < 60) {
    result.notes = 'Medium confidence - verify key fields';
  } else {
    result.notes = 'High confidence - looks like a valid ID';
  }
  
  return result;
} 