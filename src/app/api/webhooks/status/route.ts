import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const webhookStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing',
      stripeKey: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
      endpoints: {
        stripe: '/api/webhooks/stripe',
        apple: '/api/webhooks/apple',
        status: '/api/webhooks/status'
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on configuration
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      webhookStatus.recommendations.push('STRIPE_WEBHOOK_SECRET environment variable is missing');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      webhookStatus.recommendations.push('STRIPE_SECRET_KEY environment variable is missing');
    }

    if (process.env.NODE_ENV === 'development') {
      webhookStatus.recommendations.push('Running in development mode - webhook signature verification is relaxed');
      webhookStatus.recommendations.push('Use "stripe listen --forward-to localhost:3001/api/webhooks/stripe" for local testing');
    }

    return NextResponse.json(webhookStatus);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get webhook status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Webhook status endpoint is working',
    timestamp: new Date().toISOString(),
    method: 'POST'
  });
} 