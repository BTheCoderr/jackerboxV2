import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import logger from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET() {
  try {
    // Test creating a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      metadata: {
        test: 'true'
      }
    });

    // Test retrieving the payment intent
    const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      },
      retrievedIntent: {
        id: retrievedIntent.id,
        status: retrievedIntent.status
      }
    });
  } catch (error) {
    logger.error('Stripe API test failed:', error);
    return NextResponse.json(
      { error: 'Stripe API test failed', details: error },
      { status: 500 }
    );
  }
} 