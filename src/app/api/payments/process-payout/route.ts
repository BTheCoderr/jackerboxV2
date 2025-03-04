import { NextResponse } from 'next/server';
import { z } from 'zod';

import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { sendNotification, NotificationType } from '@/lib/notifications/notification-service';

// Schema for validating the request body
const payoutSchema = z.object({
  rentalId: z.string(),
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
    const validationResult = payoutSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    
    const { rentalId } = validationResult.data;

    // Get the rental with related data
    const rental = await db.rental.findUnique({
      where: {
        id: rentalId,
        status: 'COMPLETED', // Only process payouts for completed rentals
      },
      include: {
        equipment: {
          include: {
            owner: true,
          },
        },
        payment: true,
      },
    });

    if (!rental) {
      return new NextResponse('Rental not found or not completed', { status: 404 });
    }

    if (!rental.payment || rental.payment.status !== 'COMPLETED') {
      return new NextResponse('Payment not completed', { status: 400 });
    }

    // Check if payout has already been processed
    if (rental.payment.ownerPaidOut) {
      return new NextResponse('Payout already processed', { status: 400 });
    }

    // Check if the owner has a Stripe Connect account
    if (!rental.equipment.owner.stripeConnectAccountId) {
      return new NextResponse('Equipment owner does not have a Stripe Connect account', { status: 400 });
    }

    // Calculate platform fee (e.g., 10% of rental amount)
    const platformFeePercentage = 0.10; // 10%
    const rentalAmount = rental.payment.rentalAmount || rental.totalPrice;
    const platformFee = rentalAmount * platformFeePercentage;
    const ownerAmount = rentalAmount - platformFee;

    // Process the payout using Stripe Connect
    const transfer = await stripe.transfers.create({
      amount: formatAmountForStripe(ownerAmount, 'USD'),
      currency: 'usd',
      destination: rental.equipment.owner.stripeConnectAccountId,
      transfer_group: rental.id,
      metadata: {
        rentalId: rental.id,
        paymentId: rental.payment.id,
        equipmentId: rental.equipment.id,
        ownerId: rental.equipment.owner.id
      },
      description: `Payout for rental of ${rental.equipment.name} from ${new Date(rental.startDate).toLocaleDateString()} to ${new Date(rental.endDate).toLocaleDateString()}`
    });

    // Update the payment record
    await db.payment.update({
      where: {
        id: rental.payment.id,
      },
      data: {
        ownerPaidOut: true,
        ownerPaidOutAmount: ownerAmount,
        platformFee: platformFee,
        stripeTransferId: transfer.id, // Store the transfer ID for reference
      },
    });

    // Send notification to the owner
    if (rental.equipment.owner.id) {
      await sendNotification({
        userId: rental.equipment.owner.id,
        type: NotificationType.PAYOUT_PROCESSED,
        data: {
          amount: ownerAmount,
          propertyName: rental.equipment.name,
          checkIn: rental.startDate,
          checkOut: rental.endDate,
          transferId: transfer.id
        },
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      rentalId: rental.id,
      ownerAmount,
      platformFee,
      transferId: transfer.id
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return new NextResponse('Error processing payout', { status: 500 });
  }
} 