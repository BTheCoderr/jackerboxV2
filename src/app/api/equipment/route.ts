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

function parseStoredStrings(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
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
  const pageRaw = Number(params.get('page') || '1');
  const limitRaw = Number(params.get('limit') || '20');
  const sortBy = params.get('sortBy') || 'relevance';
  const validSort = ['relevance', 'newest', 'price_asc', 'price_desc'];

  if (query.length > 120 || location.length > 100 ||
      (category && category !== 'all' && !EQUIPMENT_CATEGORIES.includes(category)) ||
      !Number.isSafeInteger(pageRaw) || pageRaw < 1 || pageRaw > 10000 ||
      !Number.isSafeInteger(limitRaw) || limitRaw < 1 || limitRaw > 50 ||
      !validSort.includes(sortBy) ||
      [minPrice, maxPrice].some(n => n !== undefined && (!Number.isFinite(n) || n < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    return NextResponse.json({ message: 'Invalid search filters' }, { status: 400 });
  }

  // Geographic-radius searching is not supported until listings store coordinates.
  // Reject it instead of returning unfiltered results pretending they are nearby.
  if (['lat', 'lng', 'maxDistance'].some(key => params.has(key))) {
    return NextResponse.json({ message: 'Distance filtering is not available yet. Search by city instead.' }, { status: 400 });
  }

  const where: Prisma.EquipmentWhereInput = {
    moderationStatus: 'APPROVED',
    isAvailable: true,
    ...(category && category !== 'all' ? { category } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
  };

  const filters: Prisma.EquipmentWhereInput[] = [];
  if (query) {
    filters.push({ OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ] });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
    filters.push({ OR: [{ dailyRate: range }, { hourlyRate: range }, { weeklyRate: range }] });
  }
  if (filters.length) where.AND = filters;

  const orderBy: Prisma.EquipmentOrderByWithRelationInput[] =
    sortBy === 'price_asc' ? [{ dailyRate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }] :
    sortBy === 'price_desc' ? [{ dailyRate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }] :
    [{ createdAt: 'desc' }];

  try {
    const [total, rows] = await Promise.all([
      db.equipment.count({ where }),
      db.equipment.findMany({
        where,
        include: { owner: { select: { id: true, name: true, image: true } } },
        orderBy,
        take: limitRaw,
        skip: (pageRaw - 1) * limitRaw,
      }),
    ]);
    const equipment = rows.map(item => ({
      ...item,
      images: parseStoredStrings(item.imagesJson),
      tags: parseStoredStrings(item.tagsJson),
    }));
    return NextResponse.json({
      equipment,
      pagination: {
        total,
        page: pageRaw,
        limit: limitRaw,
        pages: Math.ceil(total / limitRaw),
      },
    });
  } catch (error) {
    console.error('Equipment retrieval failed', error);
    return NextResponse.json({ message: 'Unable to load equipment' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
