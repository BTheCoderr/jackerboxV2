import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment';
import { handleStripeEvent, respondToWebhook } from '@/lib/webhooks/stripe-webhook-handler';
import logger from '@/lib/logger';
import { db } from '@/lib/db';

// This is a test webhook handler that simulates Stripe webhook events
export async function POST(req: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }
    
    const { event: eventType } = await req.json();

    // First create a test payment in the database to simulate with
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: 'No users found in the database for testing' },
        { status: 400 }
      );
    }

    // Create a test payment intent with our service
    const { paymentIntent } = await PaymentService.createPaymentIntent(1000, 'usd', {
      userId: user.id,
      securityDeposit: '200',
      rentalAmount: '800',
    });

    // Construct a mock Stripe event
    const mockEvent = {
      id: `evt_${Date.now()}`,
      object: 'event',
      type: eventType,
      data: {
        object: paymentIntent
      }
    };

    // Use the shared event handler
    const result = await handleStripeEvent(mockEvent as any);
    
    // Return the response using the shared response formatter
    return respondToWebhook({
      ...result,
      testMode: true,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    logger.error('Error processing test webhook:', error);
    return respondToWebhook(null, error);
  }
} 