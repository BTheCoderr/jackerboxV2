import { Redis } from '@upstash/redis'
import { withTimeout } from '../api-utils';
import { compress, decompress } from 'lz-string';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Cache TTL constants
const TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
}

// Cache prefix for different types of data
const PREFIX = {
  EQUIPMENT: 'equipment:',
  USER: 'user:',
  RENTAL: 'rental:',
  SEARCH: 'search:',
}

// Compression threshold in bytes
const COMPRESSION_THRESHOLD = 1024; // 1KB

async function shouldCompress(data: string): Promise<boolean> {
  return Buffer.byteLength(data, 'utf8') > COMPRESSION_THRESHOLD;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await withTimeout(
      redis.get(key),
      1000 // 1 second timeout
    );

    if (!data) return null;

    // Check if data is compressed
    const isCompressed = typeof data === 'string' && data.startsWith('COMPRESSED:');
    if (isCompressed) {
      const compressedData = data.slice(11); // Remove 'COMPRESSED:' prefix
      const decompressedData = decompress(compressedData);
      return JSON.parse(decompressedData);
    }

    return data as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl = TTL.MEDIUM): Promise<void> {
  try {
    const stringValue = JSON.stringify(value);
    
    // Check if compression should be applied
    const shouldCompressData = await shouldCompress(stringValue);
    const finalValue = shouldCompressData 
      ? `COMPRESSED:${compress(stringValue)}`
      : stringValue;

    await withTimeout(
      redis.set(key, finalValue, { ex: ttl }),
      1000
    );
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await withTimeout(
      redis.del(key),
      1000
    );
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await withTimeout(
        redis.del(...keys),
        2000
      );
    }
  } catch (error) {
    console.error('Redis delete pattern error:', error);
  }
}

// Helper functions for specific data types
export const equipmentCache = {
  key: (id: string) => `${PREFIX.EQUIPMENT}${id}`,
  list: (page: number = 1) => `${PREFIX.EQUIPMENT}list:${page}`,
  search: (query: string) => `${PREFIX.SEARCH}equipment:${query}`,
  
  async get<T>(id: string): Promise<T | null> {
    return cacheGet<T>(this.key(id));
  },
  
  async set(id: string, data: any): Promise<void> {
    await cacheSet(this.key(id), data, TTL.MEDIUM);
  },
  
  async invalidate(id: string): Promise<void> {
    await cacheDeletePattern(`${PREFIX.EQUIPMENT}*`);
    await cacheDeletePattern(`${PREFIX.SEARCH}equipment:*`);
  }
}

export const userCache = {
  key: (id: string) => `${PREFIX.USER}${id}`,
  
  async get<T>(id: string): Promise<T | null> {
    return cacheGet<T>(this.key(id));
  },
  
  async set(id: string, data: any): Promise<void> {
    await cacheSet(this.key(id), data, TTL.LONG);
  },
  
  async invalidate(id: string): Promise<void> {
    await cacheDelete(this.key(id));
  }
}

export const rentalCache = {
  key: (id: string) => `${PREFIX.RENTAL}${id}`,
  listByUser: (userId: string) => `${PREFIX.RENTAL}user:${userId}`,
  
  async get<T>(id: string): Promise<T | null> {
    return cacheGet<T>(this.key(id));
  },
  
  async set(id: string, data: any): Promise<void> {
    await cacheSet(this.key(id), data, TTL.SHORT);
  },
  
  async invalidate(id: string, userId?: string): Promise<void> {
    await cacheDelete(this.key(id));
    if (userId) {
      await cacheDelete(this.listByUser(userId));
    }
  }
} 