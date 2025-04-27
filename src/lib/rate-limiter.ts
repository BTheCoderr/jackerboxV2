import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Create a new Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || 'https://example.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || 'example_token',
});

// Create a new rate limiter that allows 10 requests per 10 seconds
export const generalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:general',
});

// More restrictive rate limiter for authentication routes
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '30 s'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// Rate limiter for API routes
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Rate limiter specifically for messaging to prevent spam
export const messageRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'ratelimit:messages',
});

/**
 * Check if a request is rate limited
 * @param ip The IP address to check
 * @param limiter The rate limiter to use
 * @returns An object with the result of the rate limit check
 */
export async function checkRateLimit(ip: string, limiter = generalRateLimiter) {
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  return {
    success,
    limit,
    reset,
    remaining,
    isLimited: !success
  };
}

/**
 * Middleware to handle rate limiting
 * @param req The request object
 * @param limiter The rate limiter to use (defaults to generalRateLimiter)
 * @returns An object with rate limit information and headers
 */
export async function rateLimitRequest(
  req: Request, 
  limiter = generalRateLimiter
) {
  // Get the IP from the request
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  
  // Check if the request is rate limited
  const result = await checkRateLimit(ip.split(',')[0], limiter);
  
  // Create rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  
  return {
    ...result,
    headers
  };
} 