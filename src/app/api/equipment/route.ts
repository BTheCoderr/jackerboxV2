import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/prisma-client";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/constants";

// Minimum number of required images
const MIN_REQUIRED_IMAGES = 3;

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
      return Array.isArray(images) && images.length >= MIN_REQUIRED_IMAGES && images.length <= 5 && images.every((url: unknown) => { try { return typeof url === 'string' && new URL(url).protocol === 'https:'; } catch { return false; } });
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
      { equipment, id: equipment.id, message: "Equipment created successfully" },
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

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('query') ?? '').trim();
  const category = (params.get('category') ?? '').trim();
  const location = (params.get('location') ?? '').trim();
  const minRaw = params.get('priceMin') ?? params.get('minPrice');
  const maxRaw = params.get('priceMax') ?? params.get('maxPrice');
  const minPrice = minRaw == null || minRaw === '' ? undefined : Number(minRaw);
  const maxPrice = maxRaw == null || maxRaw === '' ? undefined : Number(maxRaw);
  if (query.length > 120 || category.length > 80 || location.length > 100 ||
      [minPrice, maxPrice].some(n => n !== undefined && (!Number.isFinite(n) || n < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    return NextResponse.json({ message: 'Invalid search filters' }, { status: 400 });
  }
  const where: Prisma.EquipmentWhereInput = {
    moderationStatus: 'APPROVED',
    isAvailable: true,
    ...(category ? { category } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
  };
  const filters: Prisma.EquipmentWhereInput[] = [];
  if (query) filters.push({ OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
  ] });
  if (minPrice !== undefined || maxPrice !== undefined) {
    const rate = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
    filters.push({ OR: [{ dailyRate: rate }, { hourlyRate: rate }, { weeklyRate: rate }] });
  }
  if (filters.length) where.AND = filters;
  try {
    const equipment = await db.equipment.findMany({
      where,
      include: { owner: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Equipment retrieval failed', error);
    return NextResponse.json({ message: 'Unable to load equipment' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 