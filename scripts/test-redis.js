const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

async function testRedis() {
  try {
    // Create Redis client
    const redis = new Redis('redis://:defaultpassword@localhost:6379');

    // Test basic connection
    console.log('Testing Redis connection...');
    const pingResult = await redis.ping();
    console.log('Redis PING result:', pingResult);

    // Test rate limiter
    console.log('\nTesting rate limiter...');
    const rateLimiter = new RateLimiterRedis({
      storeClient: redis,
      points: 5, // Number of points
      duration: 5, // Per 5 seconds
    });

    // Simulate multiple requests
    for (let i = 1; i <= 7; i++) {
      try {
        const rateLimiterRes = await rateLimiter.consume('test_user');
        console.log(`Request ${i}: Remaining points: ${rateLimiterRes.remainingPoints}`);
      } catch (error) {
        console.log(`Request ${i}: Rate limit exceeded. Try again in ${error.msBeforeNext / 1000} seconds`);
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\nRedis test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Redis test failed:', error);
    process.exit(1);
  }
}

testRedis(); 