import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '../prisma/generated/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const prisma = new PrismaClient();

async function testRealWebhookFlow() {
  console.log('🧪 Testing Real Webhook Flow...\n');

  try {
    // Step 1: Create a test payment intent
    console.log('1️⃣ Creating payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      metadata: {
        test: 'true',
        source: 'webhook-test'
      }
    });
    console.log(`✅ Created payment intent: ${paymentIntent.id}\n`);

    // Step 2: Create corresponding payment record in database
    console.log('2️⃣ Creating payment record in database...');
    await prisma.payment.create({
      data: {
        amount: 2000,
        currency: 'USD',
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
        metadata: {
          test: true,
          source: 'webhook-test'
        },
        // Note: userId and rentalId would normally be required
        // but we'll make them optional for testing
      }
    });
    console.log(`✅ Payment record created in database\n`);

    // Step 3: Simulate payment success
    console.log('3️⃣ Simulating payment success...');
    const succeededIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa', // Test card
      return_url: 'http://localhost:3001/test-stripe'
    });
    console.log(`✅ Payment confirmed: ${succeededIntent.status}\n`);

    // Step 4: Manually trigger webhook (simulates Stripe calling our webhook)
    console.log('4️⃣ Testing webhook handler...');
    const webhookPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: succeededIntent
      },
      type: 'payment_intent.succeeded',
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      }
    };

    const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // Note: signature verification disabled for local testing
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      console.log(`Status: ${response.status}`);
    } else {
      console.log('❌ Webhook failed:');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${await response.text()}`);
    }

    // Step 5: Check final payment status
    console.log('\n5️⃣ Checking final payment status...');
    const finalPayment = await prisma.payment.findUnique({
      where: {
        stripePaymentIntentId: paymentIntent.id
      }
    });

    if (finalPayment) {
      console.log(`✅ Payment status: ${finalPayment.status}`);
      console.log(`✅ Payment completed at: ${finalPayment.paidAt || 'Not set'}`);
    }

    console.log('\n🎉 Real webhook test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealWebhookFlow(); 