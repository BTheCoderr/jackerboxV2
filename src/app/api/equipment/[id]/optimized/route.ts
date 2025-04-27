import { NextResponse } from 'next/server';
import { getEquipmentWithRelations, getCachedReviewStats } from '@/lib/db-optimizations';
import { log, trackApiRequest, recordError } from '@/lib/monitoring';

/**
 * Optimized API endpoint to fetch equipment details with performance tracking and caching
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Start performance tracking
  const tracker = trackApiRequest(request, 'GET /api/equipment/[id]/optimized');
  
  try {
    const equipmentId = params.id;
    
    // Get query parameters
    const url = new URL(request.url);
    const includeOwner = url.searchParams.get('includeOwner') !== 'false';
    const includeReviews = url.searchParams.get('includeReviews') !== 'false';
    const includeAvailability = url.searchParams.get('includeAvailability') !== 'false';
    const includeStats = url.searchParams.get('includeStats') === 'true';
    
    // Log the request
    log.info(`Fetching optimized equipment details`, { 
      equipmentId,
      includeOwner,
      includeReviews,
      includeAvailability,
      includeStats
    });
    
    // Use our optimized function to get the equipment with minimal data transfer
    const equipment = await getEquipmentWithRelations(
      equipmentId,
      includeOwner,
      includeReviews,
      includeAvailability
    );
    
    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }
    
    // Get review statistics if requested
    let reviewStats = null;
    if (includeStats) {
      reviewStats = await getCachedReviewStats(equipmentId);
    }
    
    // End tracking with success status
    tracker.end({ status: 'success' });
    
    // Return the data
    return NextResponse.json({
      equipment,
      ...(includeStats ? { stats: reviewStats } : {})
    });
  } catch (error) {
    // Record the error with context
    recordError(error as Error, { 
      equipmentId: params.id,
      endpoint: '/api/equipment/[id]/optimized'
    });
    
    // End tracking with error status
    tracker.end({ status: 'error' });
    
    // Return a 500 error
    return NextResponse.json(
      { error: 'Failed to fetch equipment details' },
      { status: 500 }
    );
  }
} 