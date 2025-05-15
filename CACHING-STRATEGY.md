# JackerBox Caching Strategy

This document outlines the caching strategy for JackerBox to improve performance and reduce database load.

## Current Implementation

JackerBox currently uses Upstash Redis for caching, with a basic setup in `src/lib/redis.ts`. The application also has some caching headers implemented in the middleware.

## Proposed Caching Strategy

### 1. Equipment Listings Cache

Equipment listings are frequently accessed and relatively static, making them ideal for caching.

```typescript
// src/lib/cache/equipment-cache.ts

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { Equipment } from '@prisma/client';

const CACHE_TTL = 60 * 60; // 1 hour
const CACHE_PREFIX = 'equipment:';

export async function getEquipment(id: string): Promise<Equipment | null> {
  const cacheKey = `${CACHE_PREFIX}${id}`;
  
  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, get from DB
  const equipment = await db.equipment.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      reviews: true,
      availability: true
    }
  });
  
  // Cache the result if found
  if (equipment) {
    await redis.set(cacheKey, JSON.stringify(equipment), { ex: CACHE_TTL });
  }
  
  return equipment;
}

// Function to invalidate cache when equipment is updated
export async function invalidateEquipmentCache(id: string): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${id}`;
  await redis.del(cacheKey);
  
  // Also invalidate any list caches that might contain this equipment
  await redis.del('equipment:list:recent');
  await redis.del('equipment:list:featured');
  // Could also invalidate by category if implemented
}

// Function to get recent equipment with caching
export async function getRecentEquipment(limit: number = 10): Promise<Equipment[]> {
  const cacheKey = `equipment:list:recent:${limit}`;
  
  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, get from DB
  const equipment = await db.equipment.findMany({
    where: {
      isAvailable: true,
      moderationStatus: 'APPROVED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
    }
  });
  
  // Cache the result
  await redis.set(cacheKey, JSON.stringify(equipment), { ex: CACHE_TTL });
  
  return equipment;
}
```

### 2. Search Results Cache

Search results can be cached by query parameters to improve performance for common searches.

```typescript
// src/lib/cache/search-cache.ts

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';

const SEARCH_CACHE_TTL = 60 * 15; // 15 minutes
const SEARCH_CACHE_PREFIX = 'search:';

type SearchParams = {
  query?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
};

export async function searchEquipment(params: SearchParams) {
  // Create a cache key based on the search parameters
  const cacheKey = generateSearchCacheKey(params);
  
  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, perform the search
  const { query, category, location, minPrice, maxPrice, page = 1, limit = 20 } = params;
  
  // Build the where clause based on the parameters
  const where: any = {
    isAvailable: true,
    moderationStatus: 'APPROVED',
  };
  
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.category = category;
  }
  
  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }
  
  if (minPrice !== undefined) {
    where.dailyRate = { gte: minPrice };
  }
  
  if (maxPrice !== undefined) {
    where.dailyRate = { ...where.dailyRate, lte: maxPrice };
  }
  
  // Perform the search
  const skip = (page - 1) * limit;
  const equipment = await db.equipment.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
    }
  });
  
  // Get the total count for pagination
  const total = await db.equipment.count({ where });
  
  const result = {
    data: equipment,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };
  
  // Cache the result
  await redis.set(cacheKey, JSON.stringify(result), { ex: SEARCH_CACHE_TTL });
  
  return result;
}

function generateSearchCacheKey(params: SearchParams): string {
  const { query, category, location, minPrice, maxPrice, page = 1, limit = 20 } = params;
  return `${SEARCH_CACHE_PREFIX}${JSON.stringify({
    q: query || '',
    cat: category || '',
    loc: location || '',
    min: minPrice || 0,
    max: maxPrice || 0,
    p: page,
    l: limit
  })}`;
}

// Invalidate search cache when any equipment is updated
export async function invalidateSearchCache(): Promise<void> {
  // Get all keys that match the search prefix
  const keys = await redis.keys(`${SEARCH_CACHE_PREFIX}*`);
  
  // Delete all keys
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 3. User Profile Cache

User profiles are accessed frequently but updated infrequently, making them good caching candidates.

```typescript
// src/lib/cache/user-cache.ts

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { User } from '@prisma/client';

const USER_CACHE_TTL = 60 * 30; // 30 minutes
const USER_CACHE_PREFIX = 'user:';

export async function getUser(id: string): Promise<User | null> {
  const cacheKey = `${USER_CACHE_PREFIX}${id}`;
  
  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, get from DB
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      phoneVerified: true,
      bio: true,
      createdAt: true,
      idVerified: true,
      userType: true,
      // Exclude sensitive fields
    }
  });
  
  // Cache the result if found
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), { ex: USER_CACHE_TTL });
  }
  
  return user;
}

// Function to invalidate cache when user is updated
export async function invalidateUserCache(id: string): Promise<void> {
  const cacheKey = `${USER_CACHE_PREFIX}${id}`;
  await redis.del(cacheKey);
}
```

### 4. Cacheable API Routes

Update API routes to use the caching functions:

```typescript
// src/app/api/equipment/[id]/route.ts

import { NextResponse } from 'next/server';
import { getEquipment } from '@/lib/cache/equipment-cache';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipment = await getEquipment(params.id);
    
    if (!equipment) {
      return NextResponse.json(
        { message: 'Equipment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { message: 'Error fetching equipment' },
      { status: 500 }
    );
  }
}
```

### 5. Cache Invalidation Hooks

Implement cache invalidation in database update functions:

```typescript
// src/lib/equipment.ts

import { db } from '@/lib/db';
import { invalidateEquipmentCache, invalidateSearchCache } from '@/lib/cache/equipment-cache';

export async function updateEquipment(id: string, data: any) {
  const updated = await db.equipment.update({
    where: { id },
    data
  });
  
  // Invalidate caches
  await invalidateEquipmentCache(id);
  await invalidateSearchCache();
  
  return updated;
}
```

### 6. Static Asset Caching

Use Vercel's edge caching for static assets:

```typescript
// middleware.ts (existing implementation)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add caching for equipment images
  if (request.nextUrl.pathname.startsWith('/images/equipment/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  
  // Add caching for Cloudinary images
  if (request.nextUrl.pathname.includes('res.cloudinary.com')) {
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/_next/static/:path*', 
    '/images/:path*',
    '/:path*',
  ],
};
```

## Implementation Plan

1. Create the caching utility functions in separate files
2. Update API routes to use the caching functions
3. Implement cache invalidation in all update/create/delete operations
4. Add monitoring to track cache hit rates
5. Adjust cache TTLs based on monitoring data

## Key Metrics to Track

- Cache hit rate
- API response times
- Database query times
- Total number of database queries

## Long-term Improvements

- Consider implementing a distributed cache for multi-region deployments
- Add fragment caching for server components
- Implement cache prefetching for common user flows 