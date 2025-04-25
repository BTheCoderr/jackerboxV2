import { NextResponse } from 'next/server';
import { handleStripeEvent, respondToWebhook } from '@/lib/webhooks/stripe-webhook-handler';
import logger from '@/lib/logger';
import Stripe from 'stripe';

/**
 * Development-only webhook endpoint that processes Stripe events without verifying signatures.
 * This is useful for testing webhooks locally with the Stripe CLI or when using forwarded webhooks.
 */
export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }
  
  try {
    // Parse the body directly without verifying signatures
    const body = await req.json();
    
    // Handle forwarded webhook events from the Stripe CLI
    // (which sends an event object directly)
    if (body.type && body.data?.object) {
      const event = body as Stripe.Event;
      const result = await handleStripeEvent(event);
      return respondToWebhook({
        ...result,
        devMode: true
      });
    }
    
    // Handle custom events sent for testing
    if (body.event_type) {
      // Construct a mock Stripe event
      const mockEvent = {
        id: `evt_${Date.now()}`,
        object: 'event',
        type: body.event_type,
        data: {
          object: body.data || {
            id: `pi_${Date.now()}`,
            object: 'payment_intent',
            amount: body.amount || 1000,
            currency: body.currency || 'usd',
            status: 'succeeded',
            created: Date.now() / 1000
          }
        }
      };
      
      const result = await handleStripeEvent(mockEvent as any);
      return respondToWebhook({
        ...result,
        devMode: true,
        mockEvent: true
      });
    }
    
    // If neither format is recognized
    return NextResponse.json(
      { 
        error: 'Invalid webhook payload format',
        hint: 'Send either a complete Stripe event object or an object with event_type and optional data fields'
      },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Error processing development webhook:', error);
    return respondToWebhook(null, error);
  }
} 