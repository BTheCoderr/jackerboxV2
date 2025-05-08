import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { PaymentService } from '@/lib/services/payment';
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/upstash-rate-limit';

// Schema for validating the request body
const refundSchema = z.object({
  rentalId: z.string(),
  amount: z.number().optional(), // Optional: if not provided, refund the full amount
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Get the current user (must be an admin or equipment owner)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimit(`refund_${currentUser.id}`);
    if (rateLimitResult) {
      return new NextResponse('Too many requests, please try again later', { status: 429 });
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
        User_Rental_renteridToUser: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        Equipment: {
          include: {
            User_Equipment_owneridToUser: {
              select: {
                id: true,
              }
            }
          }
        },
        Payment: true,
      },
    });

    if (!rental) {
      return new NextResponse('Rental not found or not completed', { status: 404 });
    }

    // Check if the current user is an admin or the equipment owner
    const isAdmin = currentUser.isadmin;
    const isOwner = rental.Equipment?.User_Equipment_owneridToUser?.id === currentUser.id;
    
    if (!isAdmin && !isOwner) {
      return new NextResponse('Unauthorized: Only admins or equipment owners can process refunds', { status: 403 });
    }

    if (!rental.Payment || rental.Payment.status !== 'COMPLETED') {
      return new NextResponse('Payment not completed', { status: 400 });
    }

    // Check if security deposit exists
    if (!rental.securitydeposit || rental.securitydeposit <= 0) {
      return new NextResponse('No security deposit to refund', { status: 400 });
    }

    // Check if security deposit has already been returned
    if (rental.Payment.securitydepositreturned) {
      return new NextResponse('Security deposit already returned', { status: 400 });
    }

    // Get the payment intent ID
    const paymentIntentId = rental.Payment.stripepaymentintentid;
    if (!paymentIntentId) {
      return new NextResponse('No payment intent ID found', { status: 400 });
    }

    // Calculate the refund amount
    const refundAmount = amount || rental.securitydeposit;

    // Process the refund using our enhanced PaymentService
    try {
      const { refund, payment } = await PaymentService.refundSecurityDeposit(
        paymentIntentId,
        Math.round(refundAmount * 100) // Convert to cents for Stripe
      );

      // Update the rental record
      await db.rental.update({
        where: {
          id: rentalId,
        },
        data: {
          securitydepositreturned: true,
          securitydepositreturndate: new Date(),
          updatedat: new Date(),
        },
      });

      // Return success response
      return NextResponse.json({
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        paymentId: payment.id,
      });
    } catch (error: any) {
      logger.error('Error processing security deposit refund:', error);
      return new NextResponse(
        error.message || 'Error processing security deposit refund', 
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Error in security deposit refund route:', error);
    return new NextResponse(
      'Error processing security deposit refund', 
      { status: 500 }
    );
  }
}