#!/usr/bin/env ts-node

import 'dotenv/config';
import prisma from '../src/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

async function createTestPaymentRecord() {
  console.log('🗄️ Creating test payment record in database...');
  
  try {
    // Create a payment intent first
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500,
      currency: 'usd',
      metadata: {
        userId: 'test-user-123',
        rentalId: 'test-rental-456',
        type: 'test_payment'
      },
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);

    // Create a test user (if not exists)
    const user = await prisma.user.upsert({
      where: { email: 'testuser@example.com' },
      update: {},
      create: {
        email: 'testuser@example.com',
        name: 'Test User',
      },
    });

    console.log('✅ Test user created/found:', user.id);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
        userId: user.id,
      },
    });

    console.log('✅ Payment record created:', payment.id);
    console.log('   Stripe Payment Intent ID:', payment.stripePaymentIntentId);
    console.log('   Amount:', payment.amount, payment.currency);
    console.log('   Status:', payment.status);

    return { paymentIntent, payment, user };
  } catch (error) {
    console.error('❌ Error creating test payment record:', error);
    throw error;
  }
}

async function testWebhookWithDatabase() {
  console.log('\n🧪 Testing webhook with actual database record...');
  
  try {
    const { paymentIntent, payment } = await createTestPaymentRecord();

    // Test webhook endpoint with real payment
    const webhookEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntent.id,
          object: 'payment_intent',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          metadata: paymentIntent.metadata,
        }
      },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null }
    };

    // Send to webhook endpoint
    const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature-bypass', // You'd need proper signature for production
      },
      body: JSON.stringify(webhookEvent),
    });

    console.log('📡 Webhook Response Status:', response.status);

    // Check if payment was updated
    const updatedPayment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (updatedPayment) {
      console.log('✅ Payment record updated:');
      console.log('   Status:', updatedPayment.status);
      console.log('   Paid At:', updatedPayment.paidAt);
    } else {
      console.log('❌ Payment record not found after webhook');
    }

  } catch (error) {
    console.error('❌ Database integration test failed:', error);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up test payments
    await prisma.payment.deleteMany({
      where: {
        userId: {
          in: await prisma.user.findMany({
            where: { email: 'testuser@example.com' },
            select: { id: true }
                     }).then((users: {id: string}[]) => users.map((u: {id: string}) => u.id))
        }
      }
    });

    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: 'testuser@example.com' }
    });

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'create':
      await createTestPaymentRecord();
      break;
    case 'test':
      await testWebhookWithDatabase();
      break;
    case 'cleanup':
      await cleanup();
      break;
    default:
      console.log('🚀 Running full database integration test...');
      await testWebhookWithDatabase();
      await cleanup();
  }

  await prisma.$disconnect();
}

main().catch(console.error); 