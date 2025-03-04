import { NextResponse } from 'next/server';
import { z } from 'zod';

import { stripe, processSecurityDepositRefund } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { sendNotification, NotificationType } from '@/lib/notifications/notification-service';

// Schema for validating the request body
const refundSchema = z.object({
  rentalId: z.string(),
  amount: z.number().optional(), // Optional: if not provided, refund the full amount
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Get the current user (must be an admin)
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = refundSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    
    const { rentalId, amount, reason } = validationResult.data;

    // Get the rental with related data
    const rental = await db.rental.findUnique({
      where: {
        id: rentalId,
        status: 'COMPLETED', // Only process refunds for completed rentals
      },
      include: {
        user: true,
        payment: true,
      },
    });

    if (!rental) {
      return new NextResponse('Rental not found or not completed', { status: 404 });
    }

    if (!rental.payment || rental.payment.status !== 'COMPLETED') {
      return new NextResponse('Payment not completed', { status: 400 });
    }

    // Check if security deposit exists
    if (!rental.payment.securityDepositAmount || rental.payment.securityDepositAmount <= 0) {
      return new NextResponse('No security deposit to refund', { status: 400 });
    }

    // Check if security deposit has already been returned
    if (rental.payment.securityDepositReturned) {
      return new NextResponse('Security deposit already returned', { status: 400 });
    }

    // Get the payment intent ID
    const paymentIntentId = rental.payment.stripePaymentIntentId;
    if (!paymentIntentId) {
      return new NextResponse('No payment intent ID found', { status: 400 });
    }

    // Calculate the refund amount in cents
    const refundAmount = amount || rental.payment.securityDepositAmount;
    const refundAmountInCents = Math.round(refundAmount * 100);

    // Process the refund
    const refund = await processSecurityDepositRefund(
      paymentIntentId,
      refundAmountInCents,
      reason
    );

    // Update the payment record
    await db.payment.update({
      where: {
        id: rental.payment.id,
      },
      data: {
        securityDepositReturned: true,
        updatedAt: new Date(),
      },
    });

    // Send notification to the user
    if (rental.user.id) {
      await sendNotification({
        userId: rental.user.id,
        type: NotificationType.SECURITY_DEPOSIT_RETURNED,
        data: {
          amount: refundAmount,
          propertyName: rental.equipmentId, // Use equipment name if available
          checkIn: rental.startDate,
          checkOut: rental.endDate,
          rentalId: rental.id,
        },
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount,
    });
  } catch (error) {
    console.error('Error processing security deposit refund:', error);
    return new NextResponse('Error processing security deposit refund', { status: 500 });
  }
} 