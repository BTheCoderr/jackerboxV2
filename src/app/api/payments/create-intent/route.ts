import { NextResponse } from 'next/server';
import { z } from 'zod';

import { formatAmountForStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { PaymentService } from '@/lib/services/payment';
import logger from '@/lib/logger';

// Schema for validating the request body
const paymentIntentSchema = z.object({
  rentalId: z.string(),
  paymentId: z.string(),
  amount: z.number().positive(),
  securityDeposit: z.number().optional(),
  currency: z.string().default('USD'),
});

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
    
    // Create a payment intent using PaymentService
    const amountInCents = formatAmountForStripe(totalAmount, currency);
    
    try {
      const paymentIntent = await PaymentService.createPaymentIntent(amountInCents, currency.toLowerCase());
      
      // Add metadata to the payment intent
      await PaymentService.updatePaymentIntent(paymentIntent.id, {
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

      // Update the payment record with the Stripe payment intent ID
      await db.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          amount: totalAmount, // Update to include security deposit
        },
      });

      // Return the client secret to the client
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in payment intent route:', error);
    return new NextResponse('Error creating payment intent', { status: 500 });
  }
} 