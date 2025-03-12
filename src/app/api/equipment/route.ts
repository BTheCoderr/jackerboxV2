import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/constants";

// Minimum number of required images
const MIN_REQUIRED_IMAGES = 7;

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
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {
      isAvailable: true,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Fetch equipment
    const equipment = await db.equipment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Count total equipment for pagination
    const total = await db.equipment.count({ where });
    
    // Process equipment to parse JSON fields
    const processedEquipment = equipment.map(item => {
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
      };
    });
    
    return NextResponse.json({
      equipment: processedEquipment,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 