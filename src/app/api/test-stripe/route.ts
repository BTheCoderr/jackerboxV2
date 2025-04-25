import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import logger from '@/lib/logger';

// Redirect all test-stripe requests to the new payments/test endpoint
export async function POST(req: Request) {
  logger.info('Redirecting test-stripe request to /api/payments/test');
  
  // Create a new request with the same body but different URL
  const body = await req.json();
  const newRequest = new Request('/api/payments/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      ...body
    }),
  });
  
  // Forward to the new endpoint
  const response = await fetch(newRequest);
  return response;
}

// Keep the GET endpoint for testing connection but with deprecation warning
export async function GET() {
  logger.warn('Deprecated endpoint: Please use /api/payments/test instead');
  
  return NextResponse.json({
    deprecated: true,
    message: 'This endpoint is deprecated. Please use /api/payments/test instead.',
  });
} 