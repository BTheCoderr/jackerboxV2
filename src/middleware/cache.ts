import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from 'ioredis';
import { getToken } from 'next-auth/jwt';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CacheOptions {
  ttl?: number;
  key?: string | ((req: NextApiRequest) => string);
  condition?: (req: NextApiRequest) => boolean;
  invalidateOn?: string[];
}

export function withCache(handler: any, options: CacheOptions = {}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      ttl = 60, // Default TTL: 60 seconds
      key,
      condition = () => true,
      invalidateOn = [],
    } = options;

    // Skip cache for non-GET methods or when condition is not met
    if (req.method !== 'GET' || !condition(req)) {
      return handler(req, res);
    }

    // Generate cache key
    const token = await getToken({ req });
    const userId = token?.sub || 'anonymous';
    
    const cacheKey = typeof key === 'function'
      ? key(req)
      : key || `${req.url}-${userId}`;

    try {
      // Check if we need to invalidate cache
      if (invalidateOn.includes(req.method || '')) {
        await redis.del(cacheKey);
      }

      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(data);
      }

      // Modify response to intercept the data
      const originalJson = res.json;
      res.json = function (data) {
        // Cache the response
        redis.setex(cacheKey, ttl, JSON.stringify(data))
          .catch(console.error);

        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      // Execute handler
      return handler(req, res);
    } catch (error) {
      console.error('Cache middleware error:', error);
      return handler(req, res);
    }
  };
}

// Cache invalidation helper
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// Cache warming helper
export async function warmCache<T>(
  key: string,
  getData: () => Promise<T>,
  ttl: number = 60
): Promise<void> {
  try {
    const data = await getData();
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache warming error:', error);
  }
}

// Example usage:
/*
export default withCache(
  async function handler(req: NextApiRequest, res: NextApiResponse) {
    const data = await fetchData();
    res.json(data);
  },
  {
    ttl: 300, // 5 minutes
    key: (req) => `data-${req.query.id}`,
    condition: (req) => !!req.query.id,
    invalidateOn: ['POST', 'PUT', 'DELETE']
  }
);
*/ 