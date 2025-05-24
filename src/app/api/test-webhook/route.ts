import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const WEBHOOK_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://jackerbox-ej0ntneyf-be-forreals-projects.vercel.app/api/webhooks/stripe'
  : 'http://localhost:3001/api/webhooks/stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function createWebhookSignature(payload: string, secret: string, timestamp: number): string {
  const elements = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(elements, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

export async function POST(request: Request) {
  try {
    const { eventType } = await request.json();

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Create a test payment intent for the webhook
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd',
      metadata: {
        userId: 'test-user-123',
        rentalId: 'test-rental-456',
        type: 'rental_payment'
      },
    });

    let eventData: any;

    switch (eventType) {
      case 'payment_intent.succeeded':
        eventData = {
          id: paymentIntent.id,
          object: 'payment_intent',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          metadata: paymentIntent.metadata,
        };
        break;

      case 'payment_intent.payment_failed':
        eventData = {
          id: paymentIntent.id,
          object: 'payment_intent',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'requires_payment_method',
          last_payment_error: {
            message: 'Test card failure',
            type: 'card_error',
            code: 'card_declined'
          },
          metadata: paymentIntent.metadata,
        };
        break;

      case 'identity.verification_session.verified':
        const verificationSession = await stripe.identity.verificationSessions.create({
          type: 'document',
          metadata: {
            userId: 'test-user-123',
          },
          return_url: 'http://localhost:3001/profile',
        });

        eventData = {
          id: verificationSession.id,
          object: 'identity.verification_session',
          status: 'verified',
          metadata: verificationSession.metadata,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported event type: ${eventType}` },
          { status: 400 }
        );
    }

    // Create the webhook event
    const event = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      data: {
        object: eventData
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      }
    };

    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createWebhookSignature(payload, WEBHOOK_SECRET, timestamp);

    // Send the webhook to our webhook endpoint
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `${eventType} webhook test completed successfully`,
        eventId: event.id,
        status: response.status
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `Webhook test failed: ${errorText}`,
          status: response.status 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
} 