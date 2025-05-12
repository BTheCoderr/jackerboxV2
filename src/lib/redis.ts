import { Redis } from '@upstash/redis';

// Initialize Redis with environment variables or with explicit configuration
export const redis = process.env.KV_URL && process.env.KV_REST_API_TOKEN
  ? Redis.fromEnv()
  : new Redis({
      url: process.env.KV_REST_API_URL || 'https://prime-ostrich-21240.upstash.io',
      token: process.env.KV_REST_API_TOKEN || 'AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA',
    });

// Optional: Create a read-only client for operations that don't need write access
export const readOnlyRedis = process.env.KV_REST_API_READ_ONLY_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL || 'https://prime-ostrich-21240.upstash.io',
      token: process.env.KV_REST_API_READ_ONLY_TOKEN || 'AlL4AAIgcDG6Ii1i0y-BbpQgbe6Wwr6fZst5dlrMknb4_VXgvw9CGw',
    })
  : redis;

/**
 * Example usage:
 * 
 * // Set a value
 * await redis.set('key', 'value');
 * 
 * // Get a value
 * const value = await redis.get('key');
 * 
 * // Delete a value
 * await redis.del('key');
 * 
 * // Set with expiration (in seconds)
 * await redis.set('key', 'value', { ex: 60 }); // Expires in 60 seconds
 */ 