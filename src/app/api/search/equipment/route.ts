import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/lib/prisma-client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const rad = (n: number) => n * Math.PI / 180;
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function jsonArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const query = (p.get('query') ?? '').trim();
  const category = (p.get('category') ?? '').trim();
  const subcategory = (p.get('subcategory') ?? '').trim();
  const location = (p.get('location') ?? '').trim();
  const page = Number(p.get('page') ?? '1');
  const limit = Number(p.get('limit') ?? '20');
  const sortBy = p.get('sortBy') ?? 'newest';

  if (query.length > 120 || category.length > 80 || subcategory.length > 80 || location.length > 100 ||
      !Number.isInteger(page) || page < 1 || page > 1000 ||
      !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: 'Invalid search criteria or pagination' }, { status: 400 });
  }

  function optionalNumber(key: string): number | undefined {
    const raw = p.get(key);
    if (raw == null || raw === '') return undefined;
    return Number(raw);
  }
  const lat = optionalNumber('lat');
  const lng = optionalNumber('lng');
  const maxDistance = optionalNumber('maxDistance');
  const priceMin = optionalNumber('priceMin');
  const priceMax = optionalNumber('priceMax');
  const numbers = [lat, lng, maxDistance, priceMin, priceMax].filter((x): x is number => x !== undefined);
  if (numbers.some(x => !Number.isFinite(x)) ||
      ((lat === undefined) !== (lng === undefined)) ||
      (lat !== undefined && (Math.abs(lat) > 90 || Math.abs(lng!) > 180)) ||
      (maxDistance !== undefined && (maxDistance <= 0 || maxDistance > 500)) ||
      (maxDistance !== undefined && lat === undefined) ||
      (priceMin !== undefined && priceMin < 0) ||
      (priceMax !== undefined && priceMax < 0) ||
      (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax)) {
    return NextResponse.json({ error: 'Invalid numeric search filters' }, { status: 400 });
  }

  const where: Prisma.EquipmentWhereInput = {
    isAvailable: true,
    moderationStatus: 'APPROVED',
    ...(category ? { category } : {}),
    ...(subcategory ? { subcategory } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
  };
  const and: Prisma.EquipmentWhereInput[] = [];
  if (query) and.push({ OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
    { category: { contains: query, mode: 'insensitive' } },
    { subcategory: { contains: query, mode: 'insensitive' } },
  ] });
  if (priceMin !== undefined || priceMax !== undefined) {
    const range = { ...(priceMin !== undefined ? { gte: priceMin } : {}),
      ...(priceMax !== undefined ? { lte: priceMax } : {}) };
    and.push({ OR: [{ hourlyRate: range }, { dailyRate: range }, { weeklyRate: range }] });
  }
  if (and.length > 0) where.AND = and;

  const sort: Prisma.EquipmentOrderByWithRelationInput =
    sortBy === 'price_asc' ? { dailyRate: 'asc' } :
    sortBy === 'price_desc' ? { dailyRate: 'desc' } :
    { createdAt: 'desc' };

  try {
    if (lat !== undefined && lng !== undefined) {
      // Bounded candidate set; safe without interpolated raw SQL.
      const candidates = await db.equipment.findMany({
        where: { ...where, latitude: { not: null }, longitude: { not: null } },
        orderBy: sort,
        take: 1000,
      });
      const filtered = candidates.map(item => ({
        ...item,
        distance: distanceKm(lat, lng, item.latitude!, item.longitude!),
      })).filter(item => maxDistance === undefined || item.distance <= maxDistance);
      if (sortBy === 'distance') filtered.sort((a, b) => a.distance - b.distance);
      const results = filtered.slice((page - 1) * limit, page * limit).map(item => ({
        ...item,
        distance: Number(item.distance.toFixed(1)),
        images: jsonArray(item.imagesJson),
        tags: jsonArray(item.tagsJson),
      }));
      return NextResponse.json({
        results,
        pagination: {
          total: filtered.length, page, limit,
          pages: Math.ceil(filtered.length / limit),
          truncated: candidates.length === 1000,
        },
      });
    }

    const [items, total] = await Promise.all([
      db.equipment.findMany({ where, orderBy: sort, skip: (page - 1) * limit, take: limit }),
      db.equipment.count({ where }),
    ]);
    return NextResponse.json({
      results: items.map(item => ({ ...item, images: jsonArray(item.imagesJson), tags: jsonArray(item.tagsJson) })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Equipment search failed', error);
    return NextResponse.json({ error: 'Search currently unavailable' }, { status: 500 });
  }
}
