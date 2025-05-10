import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Skip rate limiting if disabled
const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'development';

// Create a mock limiter for development
const mockLimiter = {
  limit: async () => ({
    success: true,
    limit: 1000,
    reset: Date.now() + 10000,
    remaining: 999,
  })
};

// Create a new Redis client only if rate limiting is enabled
const redis = !isRateLimitDisabled ? new Redis({
  url: process.env.UPSTASH_REDIS_URL || 'https://example.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || 'example_token',
}) : null;

// Create rate limiters only if not disabled
export const generalRateLimiter = !isRateLimitDisabled ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:general',
}) : mockLimiter;

export const authRateLimiter = !isRateLimitDisabled ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '30 s'),
  analytics: true,
  prefix: 'ratelimit:auth',
}) : mockLimiter;

export const apiRateLimiter = !isRateLimitDisabled ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: 'ratelimit:api',
}) : mockLimiter;

export const messageRateLimiter = !isRateLimitDisabled ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'ratelimit:messages',
}) : mockLimiter;

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