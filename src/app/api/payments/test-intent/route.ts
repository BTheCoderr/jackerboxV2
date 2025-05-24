import { NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount = 2000, securityDeposit = 500, currency = 'USD' } = body;

    // Calculate total amount including security deposit
    const totalAmount = amount + (securityDeposit || 0);
    const amountInCents = formatAmountForStripe(totalAmount, currency);
    
    // Create a test payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        type: 'test_payment',
        testMode: 'true',
        rentalAmount: amount.toString(),
        securityDepositAmount: (securityDeposit || 0).toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
    });
  } catch (error) {
    console.error('Error creating test payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 