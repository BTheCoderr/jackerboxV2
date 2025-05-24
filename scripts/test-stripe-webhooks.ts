#!/usr/bin/env ts-node

import 'dotenv/config';
import Stripe from 'stripe';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Initialize Stripe with test keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const WEBHOOK_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://jackerbox-ej0ntneyf-be-forreals-projects.vercel.app/api/webhooks/stripe'
  : 'http://localhost:3001/api/webhooks/stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET environment variable is not set');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
  process.exit(1);
}

// TypeScript assertion after validation
const validatedWebhookSecret: string = WEBHOOK_SECRET;

/**
 * Create a test payment intent that you can use for testing
 */
async function createTestPaymentIntent() {
  console.log('🔄 Creating test payment intent...');
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      metadata: {
        userId: 'test-user-123',
        rentalId: 'test-rental-456',
        type: 'rental_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);
    console.log('   Status:', paymentIntent.status);
    console.log('   Amount:', paymentIntent.amount / 100, 'USD');
    
    return paymentIntent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Create a test identity verification session
 */
async function createTestIdentitySession() {
  console.log('🔄 Creating test identity verification session...');
  
  try {
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId: 'test-user-123',
      },
      options: {
        document: {
          require_id_number: true,
          require_matching_selfie: true,
        },
      },
      return_url: 'http://localhost:3001/profile',
    });

    console.log('✅ Identity verification session created:', session.id);
    console.log('   Status:', session.status);
    
    return session;
  } catch (error) {
    console.error('❌ Error creating identity session:', error);
    throw error;
  }
}

/**
 * Create a webhook signature for testing
 */
function createWebhookSignature(payload: string, secret: string, timestamp: number): string {
  const elements = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(elements, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Test webhook with a simulated event
 */
async function testWebhookWithEvent(eventType: string, eventData: any) {
  console.log(`\n🧪 Testing webhook with ${eventType} event...`);
  
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
  const signature = createWebhookSignature(payload, validatedWebhookSecret, timestamp);

  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    if (response.ok) {
      console.log('✅ Webhook processed successfully');
      console.log('   Status:', response.status);
      const result = await response.json();
      console.log('   Response:', result);
    } else {
      console.log('❌ Webhook failed');
      console.log('   Status:', response.status);
      const error = await response.text();
      console.log('   Error:', error);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

/**
 * Main testing function
 */
async function runTests() {
  console.log('🚀 Starting Stripe Webhook Tests');
  console.log('📍 Testing endpoint:', WEBHOOK_ENDPOINT);
  console.log('🔑 Using webhook secret:', validatedWebhookSecret.substring(0, 10) + '...');
  
  try {
    // Test 1: Create a payment intent
    const paymentIntent = await createTestPaymentIntent();
    
    // Test 2: Simulate payment_intent.succeeded
    await testWebhookWithEvent('payment_intent.succeeded', {
      id: paymentIntent.id,
      object: 'payment_intent',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata,
    });

    // Test 3: Simulate payment_intent.payment_failed
    await testWebhookWithEvent('payment_intent.payment_failed', {
      id: paymentIntent.id,
      object: 'payment_intent',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'requires_payment_method',
      last_payment_error: {
        message: 'Your card was declined.',
        type: 'card_error',
        code: 'card_declined'
      },
      metadata: paymentIntent.metadata,
    });

    // Test 4: Create identity verification session
    const identitySession = await createTestIdentitySession();
    
    // Test 5: Simulate identity.verification_session.verified
    await testWebhookWithEvent('identity.verification_session.verified', {
      id: identitySession.id,
      object: 'identity.verification_session',
      status: 'verified',
      metadata: identitySession.metadata,
    });

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// CLI Commands
const command = process.argv[2];

switch (command) {
  case 'create-payment':
    createTestPaymentIntent().then(() => process.exit(0));
    break;
  case 'create-identity':
    createTestIdentitySession().then(() => process.exit(0));
    break;
  case 'test-success':
    createTestPaymentIntent().then(pi => 
      testWebhookWithEvent('payment_intent.succeeded', {
        id: pi.id,
        object: 'payment_intent',
        amount: pi.amount,
        currency: pi.currency,
        status: 'succeeded',
        metadata: pi.metadata,
      })
    ).then(() => process.exit(0));
    break;
  case 'test-failed':
    createTestPaymentIntent().then(pi => 
      testWebhookWithEvent('payment_intent.payment_failed', {
        id: pi.id,
        object: 'payment_intent',
        amount: pi.amount,
        currency: pi.currency,
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Test failure',
          type: 'card_error',
          code: 'card_declined'
        },
        metadata: pi.metadata,
      })
    ).then(() => process.exit(0));
    break;
  case 'full':
  default:
    runTests().then(() => process.exit(0));
} 