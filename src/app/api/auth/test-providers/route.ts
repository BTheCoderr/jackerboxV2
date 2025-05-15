import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test configuration for all providers
    const providers = {
      apple: {
        configured: !!(
          process.env.APPLE_CLIENT_ID &&
          process.env.APPLE_TEAM_ID &&
          process.env.APPLE_KEY_ID &&
          process.env.APPLE_PRIVATE_KEY
        ),
        clientId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        hasPrivateKey: !!process.env.APPLE_PRIVATE_KEY,
      },
      google: {
        configured: !!(
          process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET
        ),
        clientId: process.env.GOOGLE_CLIENT_ID,
        hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      nextauth: {
        configured: !!(
          process.env.NEXTAUTH_URL &&
          process.env.NEXTAUTH_SECRET
        ),
        url: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
      },
    };

    // Check database configuration
    const dbConfigured = !!process.env.DATABASE_URL;

    // Check Redis configuration for rate limiting
    const redisConfigured = !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    );

    return NextResponse.json({
      providers,
      database: {
        configured: dbConfigured,
        url: process.env.DATABASE_URL?.split('?')[0], // Remove query params for security
      },
      redis: {
        configured: redisConfigured,
        url: process.env.UPSTASH_REDIS_REST_URL?.split('@')[0], // Remove credentials for security
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Provider test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 