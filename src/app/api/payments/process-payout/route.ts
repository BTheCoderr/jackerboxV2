import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { PaymentService } from '@/lib/services/payment';
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/upstash-rate-limit';

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

    // Apply rate limiting
    const rateLimitResult = await rateLimit(`payout_${currentUser.id}`);
    if (rateLimitResult) {
      return new NextResponse('Too many requests, please try again later', { status: 429 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = payoutSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    
    const { rentalId } = validationResult.data;

    // Process the payout using our enhanced PaymentService
    try {
      const { transfer, rental } = await PaymentService.processOwnerPayout(rentalId);
      
      // Return success response
      return NextResponse.json({
        success: true,
        rentalId: rental.id,
        ownerAmount: rental.payoutAmount,
        transferId: transfer.id
      });
    } catch (error: any) {
      logger.error('Error processing payout:', error);
      return new NextResponse(
        error.message || 'Error processing payout', 
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Error in payout route:', error);
    return new NextResponse('Error processing payout', { status: 500 });
  }
}