import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { NextResponse } from 'next/server'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
}

// Create a new Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '60s'), // 100 requests per 60 seconds
  analytics: true,
  prefix: '@upstash/ratelimit',
})

export async function rateLimit(identifier: string) {
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      )
    }

    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On error, we'll allow the request to proceed
    return null
  }
}

// Function to check if Redis is connected
export async function checkRedisConnection() {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection error:', error)
    return false
  }
}

export default redis 