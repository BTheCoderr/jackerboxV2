import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { log, trackApiRequest, recordError } from '@/lib/monitoring';
import { getPagination } from '@/lib/db-optimizations';

/**
 * Admin API endpoint to fetch verification requests
 * This API is only accessible to administrators
 */
export async function GET(request: Request) {
  const tracker = trackApiRequest(request, 'GET /api/admin/verification-requests');
  
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
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Use our pagination utility
    const pagination = getPagination(page, limit);
    
    // Fetch verification requests with user details
    const requests = await db.verificationRequest.findMany({
      where: { 
        status: status as string
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      ...pagination
    });
    
    // Get total count for pagination
    const totalCount = await db.verificationRequest.count({
      where: { 
        status: status as string
      }
    });
    
    // Format the response data
    const formattedRequests = requests.map(request => ({
      id: request.id,
      userId: request.userId,
      userName: request.user.name,
      userEmail: request.user.email,
      userImage: request.user.image,
      type: request.type,
      status: request.status,
      documentId: request.documentId,
      confidenceScore: request.confidenceScore,
      extractedText: request.extractedText,
      notes: request.notes,
      createdAt: request.createdAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
      reviewedBy: request.reviewedBy,
    }));
    
    // Log the access
    log.info('Admin fetched verification requests', {
      adminId: session.user.id,
      status,
      count: requests.length,
    });
    
    // End performance tracking
    tracker.end({ status: 'success' });
    
    // Return the requests with pagination info
    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    // Record the error
    recordError(error as Error, {
      endpoint: '/api/admin/verification-requests',
      method: 'GET',
    });
    
    // End performance tracking with error
    tracker.end({ status: 'error' });
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
} 