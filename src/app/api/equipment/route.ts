import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/constants";

// Minimum number of required images
const MIN_REQUIRED_IMAGES = 7;

// Cache control headers for GET requests
const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
};

const equipmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  condition: z.enum(EQUIPMENT_CONDITIONS as [string, ...string[]]),
  category: z.enum(EQUIPMENT_CATEGORIES as [string, ...string[]]),
  subcategory: z.string().optional(),
  location: z.string().min(3, "Location is required"),
  hourlyRate: z.number().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  tagsJson: z.string(),
  imagesJson: z.string(),
}).refine(
  (data) => data.hourlyRate || data.dailyRate || data.weeklyRate,
  {
    message: "At least one rate (hourly, daily, or weekly) is required",
    path: ["hourlyRate"],
  }
).refine(
  (data) => {
    try {
      const images = JSON.parse(data.imagesJson);
      return Array.isArray(images) && images.length >= MIN_REQUIRED_IMAGES;
    } catch {
      return false;
    }
  },
  {
    message: `Please upload at least ${MIN_REQUIRED_IMAGES} images of your equipment.`,
    path: ["imagesJson"],
  }
);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a renter (has rental history)
    const userRentals = await db.rental.count({
      where: {
        renterId: user.id
      }
    });
    
    if (userRentals > 0) {
      return NextResponse.json(
        { message: "Renters cannot create equipment listings. Please use a separate owner account." },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const validatedData = equipmentSchema.parse(body);
    
    const equipment = await db.equipment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        condition: validatedData.condition,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        location: validatedData.location,
        hourlyRate: validatedData.hourlyRate,
        dailyRate: validatedData.dailyRate,
        weeklyRate: validatedData.weeklyRate,
        securityDeposit: validatedData.securityDeposit,
        tagsJson: validatedData.tagsJson,
        imagesJson: validatedData.imagesJson,
        isVerified: false,
        isAvailable: true,
        ownerId: user.id,
      },
    });
    
    return NextResponse.json(
      { equipment, message: "Equipment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Equipment creation error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters with defaults and validation
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50); // Cap at 50 items
    const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1); // Minimum page 1
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const location = url.searchParams.get("location");
    const minPrice = url.searchParams.get("minPrice") ? parseFloat(url.searchParams.get("minPrice")!) : undefined;
    const maxPrice = url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined;
    const sortBy = url.searchParams.get("sortBy") || "relevance";
    
    // Parse user location if provided
    const userLat = url.searchParams.get("userLat") ? parseFloat(url.searchParams.get("userLat")!) : undefined;
    const userLng = url.searchParams.get("userLng") ? parseFloat(url.searchParams.get("userLng")!) : undefined;
    const maxDistance = url.searchParams.get("maxDistance") ? parseFloat(url.searchParams.get("maxDistance")!) : undefined;
    
    // Check for cache parameter - if nocache is present, skip caching
    const noCache = url.searchParams.has("nocache");
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {
      isAvailable: true,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
      };
    }
    
    // Debug logs
    console.log('Equipment API called with params:', Object.fromEntries(url.searchParams.entries()));
    console.log('Using where clause:', JSON.stringify(where));
    
    // Import the search utilities if search parameter is provided
    if (search || minPrice || maxPrice || (userLat && userLng && maxDistance)) {
      const { generateEnhancedSearchQuery } = await import('@/lib/search/search-utils');
      
      // Prepare search options
      const searchOptions: any = {};
      
      // Add price range if provided
      if (minPrice !== undefined || maxPrice !== undefined) {
        searchOptions.priceRange = {
          min: minPrice,
          max: maxPrice
        };
      }
      
      // Add user location if provided
      if (userLat !== undefined && userLng !== undefined) {
        searchOptions.userLocation = {
          latitude: userLat,
          longitude: userLng
        };
        
        // Add max distance if provided
        if (maxDistance !== undefined) {
          searchOptions.maxDistance = maxDistance;
        }
      }
      
      // Add categories if provided
      if (category) {
        searchOptions.categories = [category];
      }
      
      // Generate enhanced search query for title, description, and tags
      const enhancedSearchQuery = generateEnhancedSearchQuery(
        search || '', 
        ['title', 'description', 'tagsJson'],
        searchOptions
      );
      
      // Merge the enhanced search query with the existing where clause
      if (Object.keys(enhancedSearchQuery).length > 0) {
        if (enhancedSearchQuery.AND) {
          where.AND = enhancedSearchQuery.AND;
        } else {
          Object.assign(where, enhancedSearchQuery);
        }
      }
      
      // Add location-based filtering if user coordinates and max distance are provided
      if (userLat !== undefined && userLng !== undefined && maxDistance !== undefined) {
        // We'll handle distance filtering in post-processing
        // But we can add a rough bounding box filter to improve query performance
        const earthRadius = 6371; // km
        const latDelta = (maxDistance / earthRadius) * (180 / Math.PI);
        const lngDelta = (maxDistance / earthRadius) * (180 / Math.PI) / Math.cos(userLat * Math.PI / 180);
        
        where.AND = where.AND || [];
        where.AND.push({
          latitude: {
            gte: userLat - latDelta,
            lte: userLat + latDelta,
          },
          longitude: {
            gte: userLng - lngDelta,
            lte: userLng + lngDelta,
          }
        });
      }
    }
    
    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_low") {
      orderBy = { dailyRate: "asc" };
    } else if (sortBy === "price_high") {
      orderBy = { dailyRate: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    }
    // For "relevance" and "distance", we'll sort in post-processing
    
    // Execute both queries in parallel for better performance
    const [equipment, total] = await Promise.all([
      db.equipment.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          subcategory: true,
          condition: true,
          location: true,
          hourlyRate: true,
          dailyRate: true,
          weeklyRate: true,
          imagesJson: true,
          tagsJson: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      db.equipment.count({ where })
    ]);
    
    console.log(`Found ${total} equipment items matching the criteria`);
    
    // Define the type for processed equipment with enhanced properties
    type ProcessedEquipment = typeof equipment[0] & {
      images: string[];
      tags: string[];
      distance?: number;
      relevanceScore?: number;
      pricePerDay: number;
    };
    
    // Process equipment to parse JSON fields and enhance with distance/relevance
    let processedEquipment = equipment.map(item => {
      try {
        // Parse images JSON if it exists
        let images: string[] = [];
        if (item.imagesJson) {
          try {
            images = JSON.parse(item.imagesJson);
          } catch (e) {
            console.error("Error parsing images JSON:", e);
          }
        }
        
        // Parse tags JSON if it exists
        let tags: string[] = [];
        if (item.tagsJson) {
          try {
            tags = JSON.parse(item.tagsJson);
          } catch (e) {
            console.error("Error parsing tags JSON:", e);
          }
        }
        
        return {
          ...item,
          images,
          tags,
          pricePerDay: item.dailyRate || 0, // Add pricePerDay for EquipmentCard compatibility
        } as ProcessedEquipment;
      } catch (error) {
        console.error("Error processing equipment item:", error);
        return {
          ...item,
          images: [],
          tags: [],
          pricePerDay: item.dailyRate || 0,
        } as ProcessedEquipment;
      }
    });
    
    // Apply post-processing for distance and relevance sorting
    if ((userLat !== undefined && userLng !== undefined) || search) {
      const { enhanceSearchResults } = await import('@/lib/search/search-utils');
      
      // Prepare user location if available
      const userLocation = userLat !== undefined && userLng !== undefined 
        ? { latitude: userLat, longitude: userLng } 
        : undefined;
      
      // Enhance results with distance and relevance scores
      const enhancedResults = enhanceSearchResults(
        processedEquipment,
        search || '',
        {
          userLocation,
          searchFields: ['title', 'description', 'tags'],
          sortByDistance: sortBy === 'distance'
        }
      );
      
      // Filter by max distance if needed
      if (userLocation && maxDistance !== undefined) {
        processedEquipment = enhancedResults
          .filter(item => item.distance === undefined || item.distance <= maxDistance);
      } else {
        processedEquipment = enhancedResults;
      }
      
      // Sort by relevance if needed
      if (sortBy === 'relevance' && search) {
        processedEquipment.sort((a, b) => ((b.relevanceScore || 0) - (a.relevanceScore || 0)));
      }
      
      // Sort by distance if needed
      if (sortBy === 'distance' && userLocation) {
        processedEquipment.sort((a, b) => ((a.distance || Infinity) - (b.distance || Infinity)));
      }
    }
    
    // Create the response with pagination info
    const response = {
      equipment: processedEquipment,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    
    // Return the response with caching headers if caching is not disabled
    return NextResponse.json(
      response,
      { 
        headers: noCache ? undefined : CACHE_CONTROL_HEADERS 
      }
    );
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { message: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
} 