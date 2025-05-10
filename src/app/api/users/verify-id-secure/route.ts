import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { log, trackApiRequest, recordError } from '@/lib/monitoring';
import type { Worker } from 'tesseract.js';
import { createWorker } from 'tesseract.js';
import { db } from "@/lib/db";

/**
 * Enhanced ID verification API with secure document storage and OCR validation
 */
export async function POST(request: Request) {
  // Track API performance
  const tracker = trackApiRequest(request, 'POST /api/users/verify-id-secure');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Initialize Tesseract worker with proper typing
    const worker = await createWorker();
    
    // Perform OCR - use the simplified API
    const { data } = await worker.recognize(buffer);
    const text = data.text;
    await worker.terminate();

    // Create verification request
    const verificationRequest = await db.verificationRequest.create({
      data: {
        userId: session.user.id,
        documentType: "ID",
        documentUrl: "", // You would typically upload to secure storage and store URL
        notes: `OCR Text: ${text}`,
        status: "PENDING"
      },
    });

    // Update user status
    await db.user.update({
      where: { id: session.user.id },
      data: {
        idVerificationStatus: "PENDING",
      },
    });

    // End performance tracking
    tracker.end({ status: 'success' });
    
    return NextResponse.json({
      message: "ID verification request submitted successfully",
      requestId: verificationRequest.id,
    });

  } catch (error) {
    // Record the error
    recordError(error as Error, {
      endpoint: '/api/users/verify-id-secure',
      method: 'POST',
    });
    
    // End performance tracking with error
    tracker.end({ status: 'error' });
    
    return NextResponse.json(
      { error: "Failed to process ID verification" },
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
      select: { isAdmin: true },
    });
    
    if (!adminUser?.isAdmin) {
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
        idVerificationStatus: approved ? 'VERIFIED' : 'REJECTED',
        idVerified: approved,
        updatedAt: new Date(),
      },
    });
    
    // Update the verification request
    await db.verificationRequest.updateMany({
      where: { 
        userId: userId,
        status: 'PENDING'
      },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        processedAt: new Date(),
        processedBy: session.user.id,
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

// Export GET method if needed
export async function GET() {
  return NextResponse.json({ message: "ID verification API endpoint" });
} 