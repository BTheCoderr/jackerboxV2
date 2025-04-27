import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Rate limiter for login attempts
export const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_attempt",
  points: 5, // Number of points
  duration: 60 * 60, // Per hour
});

// Rate limiter for API requests
export const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "api_request",
  points: 100, // Number of points
  duration: 60, // Per minute
});

export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  try {
    await loginLimiter.consume(ip);
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkApiRateLimit(ip: string): Promise<boolean> {
  try {
    await apiLimiter.consume(ip);
    return true;
  } catch (error) {
    return false;
  }
} 