import { NextResponse } from 'next/server';
import { z } from 'zod';

import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

// Schema for validating the request body
const paymentIntentSchema = z.object({
  rentalId: z.string(),
  paymentId: z.string(),
  amount: z.number().positive(),
  securityDeposit: z.number().optional(),
  currency: z.string().default('USD'),
});

// Mock function for development environments
async function createMockPaymentIntent(
  rentalId: string,
  amount: number,
  currency: string
) {
  console.log('Creating mock payment intent for development', {
    rentalId,
    amount,
    currency
  });
  
  // Create a fake client secret that looks like a Stripe one
  const timestamp = Date.now();
  const mockClientSecret = `mock_pi_${timestamp}_secret_${Math.random().toString(36).substring(2, 15)}`;
  
  // In development mode, automatically mark the payment as successful after a delay
  setTimeout(async () => {
    try {
      // Find the payment and update it to successful
      const payment = await db.payment.findFirst({
        where: {
          rentalId: rentalId,
        },
      });
      
      if (payment) {
        await db.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "COMPLETED",
            stripePaymentIntentId: `mock_pi_${timestamp}`,
          },
        });
        
        // Also update the rental status
        await db.rental.update({
          where: {
            id: rentalId,
          },
          data: {
            status: "ACTIVE",
          },
        });
        
        console.log(`Mock payment for rental ${rentalId} automatically marked as successful.`);
      }
    } catch (error) {
      console.error('Error processing mock payment:', error);
    }
  }, 5000); // Simulate a 5 second processing time
  
  return {
    clientSecret: mockClientSecret,
    paymentIntentId: `mock_pi_${timestamp}`,
  };
}

export async function POST(req: Request) {
  try {
    // Get the current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = paymentIntentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    
    const { rentalId, paymentId, amount, securityDeposit, currency } = validationResult.data;

    // Check if the rental exists and belongs to the current user
    const rental = await db.rental.findUnique({
      where: {
        id: rentalId,
        renterId: currentUser.id,
      },
      include: {
        equipment: true,
      },
    });

    if (!rental) {
      return new NextResponse('Rental not found or unauthorized', { status: 404 });
    }

    // Check if the payment exists and belongs to the rental
    const payment = await db.payment.findUnique({
      where: {
        id: paymentId,
        rentalId: rentalId,
      },
    });

    if (!payment) {
      return new NextResponse('Payment not found', { status: 404 });
    }

    // Calculate total amount including security deposit if provided
    const totalAmount = securityDeposit 
      ? amount + securityDeposit 
      : amount;
    
    // In development mode, use mock payment processing
    if (process.env.NODE_ENV === 'development') {
      const mockResult = await createMockPaymentIntent(
        rentalId,
        amount + (securityDeposit || 0),
        currency
      );
      
      // Update the payment record with the mock payment intent ID
      await db.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          stripePaymentIntentId: mockResult.paymentIntentId,
        },
      });
      
      return NextResponse.json({
        clientSecret: mockResult.clientSecret,
        paymentId: payment.id,
      });
    }

    // Create a real Stripe payment intent
    const amountInCents = formatAmountForStripe(totalAmount, currency);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        rentalId,
        paymentId,
        equipmentId: rental.equipmentId,
        equipmentTitle: rental.equipment.title,
        hasSecurityDeposit: securityDeposit ? 'true' : 'false',
        securityDepositAmount: securityDeposit ? securityDeposit.toString() : '0',
        rentalAmount: amount.toString(),
      },
    });

    // Update the payment record with the Stripe payment intent ID and security deposit info
    await db.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: totalAmount, // Update to include security deposit
      },
    });

    // Return the client secret to the client
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new NextResponse('Error creating payment intent', { status: 500 });
  }
} 