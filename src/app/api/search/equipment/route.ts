import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Advanced equipment search API with PostgreSQL full-text search and trigram similarity
 * Supports hybrid search combining keyword matching, location proximity, and category filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract search parameters
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const maxDistance = searchParams.get('maxDistance') ? parseFloat(searchParams.get('maxDistance')!) : null;
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    
    console.log('Search parameters:', { query, category, subcategory, lat, lng, maxDistance, priceMin, priceMax, page, limit, sortBy });
    
    // Prepare filter conditions
    const conditions: any[] = [
      { isAvailable: true },
      { moderationStatus: 'APPROVED' },
    ];
    
    // Category filters
    if (category) {
      conditions.push({ category });
    }
    
    if (subcategory) {
      conditions.push({ subcategory });
    }
    
    // Price filters
    if (priceMin !== null) {
      conditions.push({ 
        OR: [
          { dailyRate: { gte: priceMin } },
          { hourlyRate: { gte: priceMin } }
        ]
      });
    }
    
    if (priceMax !== null) {
      conditions.push({ 
        OR: [
          { dailyRate: { lte: priceMax } },
          { hourlyRate: { lte: priceMax } }
        ]
      });
    }
    
    // Prepare the search query
    let searchEquipment;
    let totalCount;
    
    // Skip pagination for first request to get totalCount
    const skip = (page - 1) * limit;
    
    try {
      // If there's a search query
      if (query.trim()) {
        console.log('Executing full-text search query');
        // Generate search vectors from user input
        const searchTerms = query.trim().split(/\s+/).filter(Boolean);
        
        try {
          // Create full-text search condition with weights for different fields
          // Add trigram similarity for fuzzy matching
          const searchConditions = await prisma.$queryRaw`
            SELECT id, 
              title, 
              description,
              category,
              subcategory,
              location,
              hourlyRate,
              dailyRate,
              weeklyRate,
              securityDeposit,
              isAvailable,
              "createdAt",
              "updatedAt",
              "moderationStatus",
              "isVerified",
              "ownerId",
              "imagesJson",
              "tagsJson",
              ts_rank(
                setweight(to_tsvector('english', title), 'A') || 
                setweight(to_tsvector('english', description), 'B') || 
                setweight(to_tsvector('english', category), 'C') ||
                setweight(to_tsvector('english', COALESCE(subcategory, '')), 'D'),
                plainto_tsquery('english', ${query})
              ) AS rank,
              CASE 
                WHEN ${lat} IS NOT NULL AND ${lng} IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
                THEN (
                  6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(latitude))
                  )
                )
                ELSE NULL
              END as distance
            FROM "Equipment"
            WHERE 
              "moderationStatus" = 'APPROVED' AND
              "isAvailable" = true AND
              (
                to_tsvector('english', title) || 
                to_tsvector('english', description) || 
                to_tsvector('english', category) ||
                to_tsvector('english', COALESCE(subcategory, ''))
              ) @@ plainto_tsquery('english', ${query})
              ${category ? ` AND category = ${category}` : ''}
              ${subcategory ? ` AND subcategory = ${subcategory}` : ''}
              ${priceMin ? ` AND (COALESCE("dailyRate", 0) >= ${priceMin} OR COALESCE("hourlyRate", 0) >= ${priceMin})` : ''}
              ${priceMax ? ` AND (COALESCE("dailyRate", 0) <= ${priceMax} OR COALESCE("hourlyRate", 0) <= ${priceMax})` : ''}
              ${(lat && lng && maxDistance) ? ` AND (
                6371 * acos(
                  cos(radians(${lat})) * 
                  cos(radians(latitude)) * 
                  cos(radians(longitude) - radians(${lng})) + 
                  sin(radians(${lat})) * 
                  sin(radians(latitude))
                )
              ) <= ${maxDistance}` : ''}
            ORDER BY 
              ${sortBy === 'distance' && lat && lng ? 'distance ASC,' : ''}
              ${sortBy === 'price_asc' ? 'COALESCE("dailyRate", "hourlyRate" * 8) ASC,' : ''}
              ${sortBy === 'price_desc' ? 'COALESCE("dailyRate", "hourlyRate" * 8) DESC,' : ''}
              ${sortBy === 'newest' ? '"createdAt" DESC,' : ''}
              ${sortBy === 'relevance' || !sortBy ? 'rank DESC,' : ''}
              "createdAt" DESC
            LIMIT ${limit} OFFSET ${skip}
          `;
          
          // Get total count for pagination
          const countResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM "Equipment"
            WHERE 
              "moderationStatus" = 'APPROVED' AND
              "isAvailable" = true AND
              (
                to_tsvector('english', title) || 
                to_tsvector('english', description) || 
                to_tsvector('english', category) ||
                to_tsvector('english', COALESCE(subcategory, ''))
              ) @@ plainto_tsquery('english', ${query})
              ${category ? ` AND category = ${category}` : ''}
              ${subcategory ? ` AND subcategory = ${subcategory}` : ''}
              ${priceMin ? ` AND (COALESCE("dailyRate", 0) >= ${priceMin} OR COALESCE("hourlyRate", 0) >= ${priceMin})` : ''}
              ${priceMax ? ` AND (COALESCE("dailyRate", 0) <= ${priceMax} OR COALESCE("hourlyRate", 0) <= ${priceMax})` : ''}
              ${(lat && lng && maxDistance) ? ` AND (
                6371 * acos(
                  cos(radians(${lat})) * 
                  cos(radians(latitude)) * 
                  cos(radians(longitude) - radians(${lng})) + 
                  sin(radians(${lat})) * 
                  sin(radians(latitude))
                )
              ) <= ${maxDistance}` : ''}
          `;
          
          searchEquipment = searchConditions;
          totalCount = (countResult as any)[0].count;
        } catch (rawQueryError) {
          console.error('Raw query error:', rawQueryError);
          
          // Fallback to standard query if raw query fails (e.g., if ts_rank is not available)
          console.log('Falling back to standard query');
          
          // Add text search condition
          conditions.push({
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { subcategory: { contains: query, mode: 'insensitive' } }
            ]
          });
          
          const baseQuery: any = {
            where: {
              AND: conditions,
            },
            skip,
            take: limit,
            orderBy: [{ createdAt: 'desc' }]
          };
          
          searchEquipment = await prisma.equipment.findMany(baseQuery);
          
          // Get total count for pagination
          totalCount = await prisma.equipment.count({
            where: {
              AND: conditions,
            },
          });
        }
      } else {
        // If no search query, just use filters
        console.log('Executing standard filter query');
        const baseQuery: any = {
          where: {
            AND: conditions,
          },
          skip,
          take: limit,
        };
        
        // Sorting options
        if (sortBy === 'price_asc') {
          baseQuery.orderBy = [{ dailyRate: 'asc' }];
        } else if (sortBy === 'price_desc') {
          baseQuery.orderBy = [{ dailyRate: 'desc' }]; 
        } else if (sortBy === 'newest') {
          baseQuery.orderBy = [{ createdAt: 'desc' }];
        } else {
          baseQuery.orderBy = [{ createdAt: 'desc' }];
        }
        
        // Execute query
        searchEquipment = await prisma.equipment.findMany(baseQuery);
        
        // Get total count for pagination
        const count = await prisma.equipment.count({
          where: {
            AND: conditions,
          },
        });
        
        totalCount = count;
      }
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      return NextResponse.json(
        { 
          error: 'Query execution failed', 
          details: queryError instanceof Error ? queryError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // Process results
    console.log(`Found ${Array.isArray(searchEquipment) ? searchEquipment.length : 0} results`);
    
    const results = Array.isArray(searchEquipment) ? searchEquipment.map(item => {
      try {
        // Parse JSON strings to objects
        const images = item.imagesJson ? JSON.parse(item.imagesJson as string) : [];
        const tags = item.tagsJson ? JSON.parse(item.tagsJson as string) : [];
        
        // Format the item
        return {
          ...item,
          images,
          tags,
          // Include distance if available
          ...(item.distance !== undefined && { distance: parseFloat(item.distance.toFixed(1)) }),
          // Include rank score if available
          ...(item.rank !== undefined && { relevanceScore: parseFloat(item.rank.toFixed(3)) }),
        };
      } catch (parseError) {
        console.error('Error parsing item JSON:', parseError, item);
        // Return item without attempting to parse JSON fields
        return {
          ...item,
          images: [],
          tags: [],
        };
      }
    }) : [];
    
    return NextResponse.json({
      results,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 