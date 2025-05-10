import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URI || 'redis://:defaultpassword@localhost:6379');

// Configure rate limiter options
const rateLimiterOptions = {
  storeClient: redisClient,
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 15, // Block for 15 minutes
};

// Create rate limiter instance
export const limiter = new RateLimiterRedis(rateLimiterOptions);

// Middleware function for rate limiting
export async function rateLimit(ip: string) {
  try {
    await limiter.consume(ip);
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }
}

// Function to check if Redis is connected
export async function checkRedisConnection() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}

// Export Redis client for use in other parts of the application
export default redisClient; 