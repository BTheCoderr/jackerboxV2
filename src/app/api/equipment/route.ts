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

// Mock data for development
const MOCK_EQUIPMENT = [
  {
    id: "clrkl6a9700016rhl7p0k7o6x",
    title: "Professional DSLR Camera Kit",
    description: "Complete professional photography kit with Canon EOS 5D Mark IV, 3 lenses, tripod, and accessories.",
    condition: "EXCELLENT",
    category: "CAMERAS",
    subcategory: "DSLR",
    tagsJson: JSON.stringify(["photography", "professional", "canon", "dslr", "complete kit"]),
    location: "New York, NY",
    latitude: 40.7128,
    longitude: -74.0060,
    hourlyRate: 25,
    dailyRate: 120,
    weeklyRate: 550,
    securityDeposit: 500,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
      "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac",
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c",
      "https://images.unsplash.com/photo-1489819608039-4765d3227809",
      "https://images.unsplash.com/photo-1584038877674-e5862eec4a59",
      "https://images.unsplash.com/photo-1493863175544-cea37e40cf23",
      "https://images.unsplash.com/photo-1432928533458-2bfcc9120d1b",
      "https://images.unsplash.com/photo-1516724562728-afc824a36e84"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-08-01T12:00:00.000Z"),
    updatedAt: new Date("2023-08-01T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0000hchl7p0k7o6x"
  },
  {
    id: "clrkl6a9700026rhl7p0k7o6y",
    title: "DJ Equipment Package",
    description: "Complete DJ setup including Pioneer CDJ-3000s, DJM-900NXS2 mixer, monitors, and accessories.",
    condition: "GOOD",
    category: "AUDIO",
    subcategory: "DJ EQUIPMENT",
    tagsJson: JSON.stringify(["dj", "pioneer", "cdj", "mixer", "professional", "complete"]),
    location: "Los Angeles, CA",
    latitude: 34.0522,
    longitude: -118.2437,
    hourlyRate: 50,
    dailyRate: 250,
    weeklyRate: 1200,
    securityDeposit: 1000,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1611425125524-b15a19feb9f7",
      "https://images.unsplash.com/photo-1557728335-4033a4665f5c",
      "https://images.unsplash.com/photo-1604599838491-5283a6e8b6c5",
      "https://images.unsplash.com/photo-1593698054932-5183a8df35f3",
      "https://images.unsplash.com/photo-1613055445505-abe37ace6843",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1599655345979-ca159e9a1212",
      "https://images.unsplash.com/photo-1630838020925-23ffed5401ff",
      "https://images.unsplash.com/photo-1591728442050-4510ee966069"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-07-15T12:00:00.000Z"),
    updatedAt: new Date("2023-07-15T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0001hchl7p0k7o6z"
  },
  {
    id: "clrkl6a9700036rhl7p0k7o6z",
    title: "4K Video Production Kit",
    description: "Complete 4K video production kit with Sony FX6, lenses, tripod, gimbal, lighting, and audio equipment.",
    condition: "LIKE_NEW",
    category: "VIDEO",
    subcategory: "CINEMA CAMERAS",
    tagsJson: JSON.stringify(["video", "4k", "cinema", "production", "sony", "professional"]),
    location: "Austin, TX",
    latitude: 30.2672,
    longitude: -97.7431,
    hourlyRate: 75,
    dailyRate: 350,
    weeklyRate: 1500,
    securityDeposit: 2000,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1616228011161-9da57ea5d95b",
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc",
      "https://images.unsplash.com/photo-1608036606284-e7f23f07f2e0",
      "https://images.unsplash.com/photo-1605128559047-b371d3c2d459",
      "https://images.unsplash.com/photo-1634157703702-3c124b455499",
      "https://images.unsplash.com/photo-1617788931512-9fbe3dce558b",
      "https://images.unsplash.com/photo-1648830292195-3e875ff983a6",
      "https://images.unsplash.com/photo-1633059388670-2bc68b83906a"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-06-20T12:00:00.000Z"),
    updatedAt: new Date("2023-06-20T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0002hchl7p0k7o7a"
  },
  {
    id: "clrkl6a9700046rhl7p0k7o7a",
    title: "Professional Drone Package",
    description: "DJI Mavic 3 Pro drone with extra batteries, ND filters, carrying case, and accessories.",
    condition: "EXCELLENT",
    category: "DRONES",
    subcategory: "PROFESSIONAL",
    tagsJson: JSON.stringify(["drone", "dji", "mavic", "aerial", "photography", "4k"]),
    location: "Miami, FL",
    latitude: 25.7617,
    longitude: -80.1918,
    hourlyRate: 35,
    dailyRate: 150,
    weeklyRate: 700,
    securityDeposit: 800,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f108",
      "https://images.unsplash.com/photo-1524143986875-3b098d911b9f",
      "https://images.unsplash.com/photo-1579829366248-204fe8413f31",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f",
      "https://images.unsplash.com/photo-1593108408993-58ee9c7825c6",
      "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044",
      "https://images.unsplash.com/photo-1560807707-8cc77767d783"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-05-10T12:00:00.000Z"),
    updatedAt: new Date("2023-05-10T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0003hchl7p0k7o7b"
  },
  {
    id: "clrkl6a9700056rhl7p0k7o7b",
    title: "Gaming PC Setup",
    description: "High-end gaming PC with RTX 4090, i9 processor, 64GB RAM, dual monitors, and gaming peripherals.",
    condition: "LIKE_NEW",
    category: "COMPUTERS",
    subcategory: "GAMING",
    tagsJson: JSON.stringify(["gaming", "pc", "rtx", "computer", "high-end", "setup"]),
    location: "Seattle, WA",
    latitude: 47.6062,
    longitude: -122.3321,
    hourlyRate: 20,
    dailyRate: 100,
    weeklyRate: 500,
    securityDeposit: 1000,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5",
      "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b",
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6",
      "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2",
      "https://images.unsplash.com/photo-1593152167544-085d3b9c4938",
      "https://images.unsplash.com/photo-1625842268584-8f3296236761",
      "https://images.unsplash.com/photo-1591489378430-ef2f4c626b15"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-04-05T12:00:00.000Z"),
    updatedAt: new Date("2023-04-05T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0004hchl7p0k7o7c"
  },
  {
    id: "clrkl6a9700066rhl7p0k7o7c",
    title: "Mobile Recording Studio",
    description: "Portable recording studio with Focusrite interface, microphones, stands, headphones, and accessories.",
    condition: "GOOD",
    category: "AUDIO",
    subcategory: "RECORDING",
    tagsJson: JSON.stringify(["recording", "audio", "studio", "portable", "focusrite", "microphones"]),
    location: "Nashville, TN",
    latitude: 36.1627,
    longitude: -86.7816,
    hourlyRate: 30,
    dailyRate: 125,
    weeklyRate: 600,
    securityDeposit: 500,
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc",
      "https://images.unsplash.com/photo-1520170350707-b2da59970118",
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625",
      "https://images.unsplash.com/photo-1563330232-57114bb0823c",
      "https://images.unsplash.com/photo-1570717173024-ec8081c8f8e9",
      "https://images.unsplash.com/photo-1512053459797-38c3a066cabd",
      "https://images.unsplash.com/photo-1527490435365-40d33ae8b17c"
    ]),
    isVerified: true,
    isAvailable: true,
    createdAt: new Date("2023-03-15T12:00:00.000Z"),
    updatedAt: new Date("2023-03-15T12:00:00.000Z"),
    moderationStatus: "APPROVED",
    ownerId: "cl8g7l5kw0005hchl7p0k7o7d"
  }
];

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
    // For development, we'll just mock the response
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock equipment creation response');
      // Mock a small delay to simulate database operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const body = await req.json();
      const mockEquipment = {
        id: `mock_${Date.now()}`,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        isAvailable: true,
        moderationStatus: "PENDING",
        ownerId: "mock_user_id",
      };
      
      return NextResponse.json(
        { equipment: mockEquipment, message: "Equipment created successfully" },
        { status: 201 }
      );
    }
    
    // Real implementation for production
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
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock equipment data');
      
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
      const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search")?.toLowerCase();
      
      // Simple filtering of mock data
      let filteredEquipment = [...MOCK_EQUIPMENT];
      
      if (category) {
        filteredEquipment = filteredEquipment.filter(item => item.category === category);
      }
      
      if (search) {
        filteredEquipment = filteredEquipment.filter(item => 
          item.title.toLowerCase().includes(search) || 
          item.description.toLowerCase().includes(search) ||
          JSON.parse(item.tagsJson).some((tag: string) => tag.toLowerCase().includes(search))
        );
      }
      
      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedEquipment = filteredEquipment.slice(start, end);
      
      // Process equipment data
      const processedEquipment = paginatedEquipment.map(item => ({
        ...item,
        images: JSON.parse(item.imagesJson),
        tags: JSON.parse(item.tagsJson),
        pricePerDay: item.dailyRate || 0
      }));
      
      // Add a small delay to simulate database query
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return NextResponse.json(
        {
          equipment: processedEquipment,
          total: filteredEquipment.length,
          page,
          limit,
          totalPages: Math.ceil(filteredEquipment.length / limit)
        },
        { 
          status: 200,
          headers: CACHE_CONTROL_HEADERS
        }
      );
    }
    
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