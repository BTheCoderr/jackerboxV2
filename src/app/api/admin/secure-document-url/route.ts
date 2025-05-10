import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { generateSecureDocumentUrl } from '@/lib/secure-storage';
import { log, trackApiRequest, recordError } from '@/lib/monitoring';

/**
 * Admin API endpoint to generate a secure URL for viewing ID documents
 * This API is only accessible to administrators
 */
export async function GET(request: Request) {
  const tracker = trackApiRequest(request, 'GET /api/admin/secure-document-url');
  
  try {
    // Verify the user is authenticated and an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
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
    
    // Get document ID from query parameters
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Generate a temporary URL for the document (expires in 10 minutes)
    const secureUrl = await generateSecureDocumentUrl(documentId, 10);
    
    // Log the access for audit purposes
    log.info('Admin accessed secure document', {
      adminId: session.user.id,
      documentId: documentId.split('/').pop() // Only log the last part of the ID
    });
    
    // End performance tracking
    tracker.end({ status: 'success' });
    
    // Return the secure URL
    return NextResponse.json({ url: secureUrl });
    
  } catch (error) {
    // Record the error
    recordError(error as Error, {
      endpoint: '/api/admin/secure-document-url',
      method: 'GET',
    });
    
    // End performance tracking with error
    tracker.end({ status: 'error' });
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to generate secure document URL' },
      { status: 500 }
    );
  }
} 