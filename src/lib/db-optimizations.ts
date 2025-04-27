/**
 * Utilities for optimizing database queries
 */

import { db } from '@/lib/db';

/**
 * Select only the necessary fields for a query to reduce data transfer
 * @param model The model to select fields from
 * @param fields The fields to select
 * @returns A select object for Prisma
 */
export function selectFields<T extends string>(fields: T[]): Record<T, boolean> {
  return fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as Record<T, boolean>);
}

/**
 * Create a simple pagination object for Prisma
 * @param page The page number (1-indexed)
 * @param limit The number of items per page
 * @returns A pagination object for Prisma
 */
export function getPagination(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return {
    take: limit,
    skip
  };
}

/**
 * Generate a cacheKey for a specific query
 */
export function generateCacheKey(model: string, queryParams: Record<string, any>): string {
  return `${model}:${JSON.stringify(queryParams)}`;
}

// In-memory cache with TTL
const queryCache = new Map<string, { data: any; expires: number }>();

/**
 * Cache the result of a database query
 * @param key The cache key
 * @param data The data to cache
 * @param ttlMs Time to live in milliseconds (default: 60 seconds)
 */
export function cacheQuery(key: string, data: any, ttlMs: number = 60000): void {
  queryCache.set(key, {
    data,
    expires: Date.now() + ttlMs
  });
}

/**
 * Get a cached query result
 * @param key The cache key
 * @returns The cached data or null if not found or expired
 */
export function getCachedQuery(key: string): any | null {
  const cached = queryCache.get(key);
  
  if (!cached) return null;
  
  if (cached.expires < Date.now()) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Clear the query cache
 * @param keyPrefix Optional prefix to only clear specific keys
 */
export function clearQueryCache(keyPrefix?: string): void {
  if (keyPrefix) {
    for (const key of queryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

/**
 * Optimized function to fetch equipment with efficient related data loading
 */
export async function getEquipmentWithRelations(
  equipmentId: string,
  includeOwner: boolean = true,
  includeReviews: boolean = true,
  includeAvailability: boolean = true
) {
  // Create cache key
  const cacheKey = generateCacheKey('equipment', { 
    id: equipmentId, 
    includeOwner, 
    includeReviews, 
    includeAvailability 
  });
  
  // Check cache first
  const cached = getCachedQuery(cacheKey);
  if (cached) return cached;
  
  // Build the query with only needed relations
  const equipment = await db.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      owner: includeOwner ? {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          createdAt: true,
          idVerified: true,
        }
      } : false,
      reviews: includeReviews ? {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      } : false,
      availability: includeAvailability
    }
  });
  
  // Cache the result
  cacheQuery(cacheKey, equipment, 30000); // 30 seconds TTL
  
  return equipment;
}

/**
 * Get review statistics with caching
 */
export async function getCachedReviewStats(equipmentId: string) {
  const cacheKey = `reviewStats:${equipmentId}`;
  
  // Try cache first
  const cached = getCachedQuery(cacheKey);
  if (cached) return cached;
  
  // Get counts
  const totalReviews = await db.review.count({
    where: { equipmentId }
  });
  
  const avgRating = await db.review.aggregate({
    where: { equipmentId },
    _avg: { rating: true }
  });
  
  // Get rating distribution
  const ratingDistribution = await db.review.groupBy({
    by: ['rating'],
    where: { equipmentId },
    _count: true
  });
  
  // Format the results
  const distribution = [1, 2, 3, 4, 5].map(rating => {
    const found = ratingDistribution.find(r => r.rating === rating);
    return {
      rating,
      count: found ? found._count : 0
    };
  });
  
  const stats = {
    totalReviews,
    averageRating: avgRating._avg.rating || 0,
    distribution
  };
  
  // Cache for 5 minutes
  cacheQuery(cacheKey, stats, 300000);
  
  return stats;
}

/**
 * Invalidate equipment caches when data changes
 */
export function invalidateEquipmentCaches(equipmentId: string) {
  clearQueryCache(`equipment:{"id":"${equipmentId}`);
  clearQueryCache(`reviewStats:${equipmentId}`);
} 