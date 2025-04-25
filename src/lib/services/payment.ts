import Stripe from 'stripe';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { Prisma } from '@prisma/client';

// Define the enums since they're not exported directly from @prisma/client
const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  BLOCKED: 'BLOCKED',
  RETRY_SCHEDULED: 'RETRY_SCHEDULED'
} as const;

const RentalStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

// Map payment statuses to rental statuses
const PAYMENT_TO_RENTAL_STATUS_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: RentalStatus.PAID,
  [PaymentStatus.FAILED]: RentalStatus.PAYMENT_FAILED,
  [PaymentStatus.BLOCKED]: RentalStatus.PAYMENT_FAILED,
  [PaymentStatus.REFUNDED]: RentalStatus.REFUNDED,
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface PaymentMetadata {
  userId: string;
  rentalId: string | null;
  securityDeposit: string | null;
  rentalAmount: string | null;
  [key: string]: string | null;
}

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Helper to find a payment by payment intent ID
const findPaymentByIntentId = async (paymentIntentId: string) => {
  const payment = await db.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { rental: true }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
};

// Helper to update payment status and related rental if exists
const updatePaymentAndRentalStatus = async (
  paymentIntentId: string, 
  paymentStatus: string,
  additionalData: Prisma.PaymentUpdateInput = {}
) => {
  const payment = await findPaymentByIntentId(paymentIntentId);
  
  const updatedPayment = await db.payment.update({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      status: paymentStatus,
      ...additionalData
    }
  });

  // Update rental status if it exists and there's a mapped status
  if (payment.rentalId && PAYMENT_TO_RENTAL_STATUS_MAP[paymentStatus]) {
    await db.rental.update({
      where: { id: payment.rentalId },
      data: { status: PAYMENT_TO_RENTAL_STATUS_MAP[paymentStatus] }
    });
  }

  return { payment, updatedPayment };
};

export class PaymentService {
  static async createPaymentIntent(amount: number, currency: string, metadata: Partial<PaymentMetadata>) {
    const stripeMetadata: Record<string, string | null> = {
      userId: metadata.userId || '',
      rentalId: metadata.rentalId || null,
      securityDeposit: metadata.securityDeposit || null,
      rentalAmount: metadata.rentalAmount || null
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: stripeMetadata,
    });

    // Generate a fake rental ID if none provided - required by Prisma schema
    const rentalId = metadata.rentalId || `temp_${Date.now()}`;

    const paymentData: Prisma.PaymentUncheckedCreateInput = {
      stripePaymentIntentId: paymentIntent.id,
      amount: amount / 100, // Convert from cents to dollars
      currency: currency.toUpperCase(),
      status: PaymentStatus.PENDING,
      userId: metadata.userId!,
      securityDepositAmount: metadata.securityDeposit ? parseFloat(metadata.securityDeposit) : null,
      rentalAmount: metadata.rentalAmount ? parseFloat(metadata.rentalAmount) : null,
      securityDepositReturned: false,
      ownerPaidOut: false,
      rentalId: rentalId
    };

    const payment = await db.payment.create({
      data: paymentData,
      include: {
        rental: true
      }
    });

    return { paymentIntent, payment };
  }

  static async handlePaymentSuccess(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const { payment, updatedPayment } = await updatePaymentAndRentalStatus(
      paymentIntentId,
      PaymentStatus.COMPLETED
    );

    return { paymentIntent, payment: updatedPayment };
  }

  static async handlePaymentFailure(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const { payment, updatedPayment } = await updatePaymentAndRentalStatus(
      paymentIntentId,
      PaymentStatus.FAILED
    );

    return { paymentIntent, payment: updatedPayment };
  }

  static async refundPayment(paymentIntentId: string) {
    // Get payment intent for validation
    await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    const { payment, updatedPayment } = await updatePaymentAndRentalStatus(
      paymentIntentId,
      PaymentStatus.REFUNDED,
      { securityDepositReturned: true }
    );

    return { refund, payment: updatedPayment };
  }

  static async updatePaymentIntent(
    paymentIntentId: string,
    updateData: Stripe.PaymentIntentUpdateParams
  ) {
    try {
      const paymentIntent = await retryOperation(() =>
        stripe.paymentIntents.update(
          paymentIntentId,
          updateData
        )
      );
      logger.info('Payment intent updated:', paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      logger.error('Error updating payment intent:', error);
      throw error;
    }
  }

  static async blockPayment(paymentIntentId: string) {
    const { updatedPayment } = await updatePaymentAndRentalStatus(
      paymentIntentId,
      PaymentStatus.BLOCKED
    );

    return updatedPayment;
  }

  static async scheduleRetry(paymentIntentId: string) {
    const payment = await db.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: PaymentStatus.RETRY_SCHEDULED,
      }
    });

    return payment;
  }
} 