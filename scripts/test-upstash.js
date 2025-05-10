require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

async function testUpstash() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash environment variables are not set');
    }

    console.log('Creating Redis client...');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('Testing connection...');
    const ping = await redis.ping();
    console.log('Ping result:', ping);

    console.log('\nTesting rate limiter...');
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '5s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    });

    // Test rate limiting
    for (let i = 1; i <= 7; i++) {
      const identifier = 'test_user';
      const result = await ratelimit.limit(identifier);
      
      console.log(`Request ${i}:`, {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString(),
      });

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\nUpstash test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Upstash test failed:', error);
    process.exit(1);
  }
}

testUpstash(); 