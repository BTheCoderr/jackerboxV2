import Stripe from 'stripe';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { Prisma, PaymentStatus, RentalStatus } from '@prisma/client';
import { rateLimit } from '@/lib/upstash-rate-limit';

// Map payment statuses to rental statuses
const PAYMENT_TO_RENTAL_STATUS_MAP: Record<PaymentStatus, RentalStatus> = {
  [PaymentStatus.COMPLETED]: RentalStatus.PAID,
  [PaymentStatus.FAILED]: RentalStatus.PAYMENT_FAILED,
  [PaymentStatus.BLOCKED]: RentalStatus.PAYMENT_FAILED,
  [PaymentStatus.REFUNDED]: RentalStatus.REFUNDED,
  [PaymentStatus.PENDING]: RentalStatus.PENDING,
  [PaymentStatus.RETRY_SCHEDULED]: RentalStatus.PENDING,
};

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const SECURITY_DEPOSIT_HOLD_DAYS = 7; // Hold security deposits for 7 days by default

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface PaymentMetadata {
  userId: string;
  rentalId: string | null;
  securityDeposit: string | null;
  rentalAmount: string | null;
  equipmentId?: string | null;
  equipmentTitle?: string | null;
  ownerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  [key: string]: string | null | undefined;
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
    where: { stripepaymentintentid: paymentIntentId },
    include: { Rental: true }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
};

// Helper to update payment status and related rental if exists
const updatePaymentAndRentalStatus = async (
  paymentIntentId: string, 
  paymentStatus: PaymentStatus,
  additionalData: Prisma.PaymentUpdateInput = {}
) => {
  const payment = await findPaymentByIntentId(paymentIntentId);
  
  const updatedPayment = await db.payment.update({
    where: { stripepaymentintentid: paymentIntentId },
    data: {
      status: paymentStatus,
      ...additionalData
    }
  });

  // Update rental status if it exists and there's a mapped status
  if (payment.rentalid && PAYMENT_TO_RENTAL_STATUS_MAP[paymentStatus]) {
    await db.rental.update({
      where: { id: payment.rentalid },
      data: { 
        status: PAYMENT_TO_RENTAL_STATUS_MAP[paymentStatus],
        updatedat: new Date()
      }
    });
  }

  return { payment, updatedPayment };
};

// Create a notification for the user
const createNotification = async (userId: string, title: string, message: string, type: string) => {
  try {
    await db.notification.create({
      data: {
        userid: userId,
        title,
        message,
        type,
        read: false,
        createdat: new Date()
      }
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    // Don't throw error here, as this is a non-critical operation
  }
};

export class PaymentService {
  static async createPaymentIntent(
    amount: number, 
    currency: string, 
    metadata: Partial<PaymentMetadata> = {}
  ) {
    try {
      // Apply rate limiting if userId is provided
      if (metadata.userId) {
        const rateLimitResult = await rateLimit(`payment_create_${metadata.userId}`);
        if (rateLimitResult) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }

      const stripeMetadata: Record<string, string | null> = {
        userId: metadata.userId || '',
        rentalId: metadata.rentalId || null,
        securityDeposit: metadata.securityDeposit || null,
        rentalAmount: metadata.rentalAmount || null,
        equipmentId: metadata.equipmentId || null,
        equipmentTitle: metadata.equipmentTitle || null,
        ownerId: metadata.ownerId || null,
        startDate: metadata.startDate || null,
        endDate: metadata.endDate || null
      };

      // Create a payment intent with the specified amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata: stripeMetadata,
        capture_method: metadata.securityDeposit ? 'manual' : 'automatic', // Use manual capture for security deposits
        setup_future_usage: 'off_session', // Allow future charges without authentication
      });

      // Generate a fake rental ID if none provided - required by Prisma schema
      const rentalId = metadata.rentalId || `temp_${Date.now()}`;

      const paymentData: Prisma.PaymentUncheckedCreateInput = {
        stripepaymentintentid: paymentIntent.id,
        amount: amount / 100, // Convert from cents to dollars
        currency: currency.toUpperCase(),
        status: PaymentStatus.PENDING,
        userid: metadata.userId!,
        rentalid: rentalId,
        metadata: metadata as any, // Store all metadata in the payment record
        createdat: new Date(),
        updatedat: new Date()
      };

      // Create the payment record in the database
      const result = await db.payment.create({
        data: paymentData,
        include: {
          Rental: true
        }
      });

      return { paymentIntent, payment: result };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  static async handlePaymentSuccess(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
      
      // Check if this is a payment with a security deposit
      const hasSecurityDeposit = metadata.securityDeposit && 
        parseFloat(metadata.securityDeposit) > 0;
      
      // If there's a security deposit, only capture the rental amount initially
      if (hasSecurityDeposit && paymentIntent.status === 'requires_capture') {
        const rentalAmount = metadata.rentalAmount ? 
          parseFloat(metadata.rentalAmount) * 100 : // Convert to cents
          paymentIntent.amount;
          
        // Capture only the rental amount, leaving the security deposit on hold
        await stripe.paymentIntents.capture(paymentIntentId, {
          amount_to_capture: rentalAmount,
        });
        
        logger.info(`Captured rental amount ${rentalAmount} for payment ${paymentIntentId}`);
      }
      
      const { updatedPayment } = await updatePaymentAndRentalStatus(
        paymentIntentId,
        PaymentStatus.COMPLETED,
        {
          paidat: new Date(),
          updatedat: new Date()
        }
      );

      // Create notification for the user
      if (metadata.userId) {
        await createNotification(
          metadata.userId,
          'Payment Successful',
          `Your payment for ${metadata.equipmentTitle || 'equipment rental'} was successful.`,
          'PAYMENT_SUCCESS'
        );
      }

      // Create notification for the owner if ownerId is available
      if (metadata.ownerId) {
        await createNotification(
          metadata.ownerId,
          'New Rental Booking',
          `Your equipment "${metadata.equipmentTitle || 'item'}" has been booked.`,
          'NEW_BOOKING'
        );
      }

      return { paymentIntent, payment: updatedPayment };
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  static async handlePaymentFailure(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
      
      const { updatedPayment } = await updatePaymentAndRentalStatus(
        paymentIntentId,
        PaymentStatus.FAILED,
        {
          failedat: new Date(),
          updatedat: new Date()
        }
      );

      // Create notification for the user
      if (metadata.userId) {
        await createNotification(
          metadata.userId,
          'Payment Failed',
          `Your payment for ${metadata.equipmentTitle || 'equipment rental'} failed. Please try again.`,
          'PAYMENT_FAILED'
        );
      }

      return { paymentIntent, payment: updatedPayment };
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  static async refundSecurityDeposit(paymentIntentId: string, amount?: number) {
    try {
      // Get payment intent for validation
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
      
      // Check if there's a security deposit to refund
      if (!metadata.securityDeposit || parseFloat(metadata.securityDeposit) <= 0) {
        throw new Error('No security deposit to refund');
      }
      
      // Calculate refund amount - either specified amount or full security deposit
      const refundAmount = amount || 
        (metadata.securityDeposit ? parseFloat(metadata.securityDeposit) * 100 : 0); // Convert to cents
      
      // Create the refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer',
      });

      const { updatedPayment } = await updatePaymentAndRentalStatus(
        paymentIntentId,
        PaymentStatus.REFUNDED,
        { 
          securitydepositreturned: true,
          refundedat: new Date(),
          updatedat: new Date()
        }
      );

      // Create notification for the user
      if (metadata.userId) {
        await createNotification(
          metadata.userId,
          'Security Deposit Refunded',
          `Your security deposit for ${metadata.equipmentTitle || 'equipment rental'} has been refunded.`,
          'REFUND_PROCESSED'
        );
      }

      return { refund, payment: updatedPayment };
    } catch (error) {
      logger.error('Error processing security deposit refund:', error);
      throw error;
    }
  }

  static async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      // Get payment intent for validation
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
      
      // Create the refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount || undefined, // If amount is not specified, refund the entire amount
      });

      const { updatedPayment } = await updatePaymentAndRentalStatus(
        paymentIntentId,
        PaymentStatus.REFUNDED,
        { 
          refundedat: new Date(),
          updatedat: new Date()
        }
      );

      // Create notification for the user
      if (metadata.userId) {
        await createNotification(
          metadata.userId,
          'Payment Refunded',
          `Your payment for ${metadata.equipmentTitle || 'equipment rental'} has been refunded.`,
          'REFUND_PROCESSED'
        );
      }

      return { refund, payment: updatedPayment };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
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

      if (!paymentIntent) {
        throw new Error('Failed to update payment intent');
      }

      logger.info('Payment intent updated:', paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      logger.error('Error updating payment intent:', error);
      throw error;
    }
  }

  static async blockPayment(paymentIntentId: string, reason: string = 'Suspicious activity') {
    try {
      const { updatedPayment } = await updatePaymentAndRentalStatus(
        paymentIntentId,
        PaymentStatus.BLOCKED,
        {
          blockreason: reason,
          isblocked: true,
          updatedat: new Date()
        }
      );

      return updatedPayment;
    } catch (error) {
      logger.error('Error blocking payment:', error);
      throw error;
    }
  }

  static async scheduleRetry(paymentIntentId: string) {
    try {
      const payment = await findPaymentByIntentId(paymentIntentId);
      
      // Increment retry count and set next retry time
      const retryCount = (payment.retrycount || 0) + 1;
      const nextRetryAt = new Date();
      nextRetryAt.setMinutes(nextRetryAt.getMinutes() + Math.pow(2, retryCount)); // Exponential backoff
      
      const updatedPayment = await db.payment.update({
        where: { stripepaymentintentid: paymentIntentId },
        data: {
          status: PaymentStatus.RETRY_SCHEDULED,
          retrycount: retryCount,
          lastretryat: new Date(),
          nextretryat: nextRetryAt,
          updatedat: new Date()
        }
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Error scheduling payment retry:', error);
      throw error;
    }
  }

  static async getPaymentDetails(paymentIntentId: string) {
    try {
      const [paymentIntent, payment] = await Promise.all([
        stripe.paymentIntents.retrieve(paymentIntentId),
        findPaymentByIntentId(paymentIntentId)
      ]);

      return { paymentIntent, payment };
    } catch (error) {
      logger.error('Error getting payment details:', error);
      throw error;
    }
  }

  static async createConnectAccount(userId: string, email: string, country: string = 'US') {
    try {
      // Check if user already has a Connect account
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { stripeconnectaccountid: true }
      });

      if (user?.stripeconnectaccountid) {
        // Return existing account
        const account = await stripe.accounts.retrieve(user.stripeconnectaccountid);
        return { account, isNew: false };
      }

      // Create a new Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { userId }
      });

      // Update user with Connect account ID
      await db.user.update({
        where: { id: userId },
        data: { stripeconnectaccountid: account.id }
      });

      return { account, isNew: true };
    } catch (error) {
      logger.error('Error creating Connect account:', error);
      throw error;
    }
  }

  static async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      logger.error('Error creating account link:', error);
      throw error;
    }
  }

  static async processOwnerPayout(rentalId: string) {
    try {
      // Get rental with equipment and payment details
      const rental = await db.rental.findUnique({
        where: { id: rentalId },
        include: {
          Equipment: {
            include: {
              User_Equipment_owneridToUser: {
                select: { id: true, stripeconnectaccountid: true }
              }
            }
          },
          Payment: true
        }
      });

      if (!rental) {
        throw new Error('Rental not found');
      }

      if (rental.status !== RentalStatus.COMPLETED) {
        throw new Error('Rental must be completed before processing payout');
      }

      const owner = rental.Equipment.User_Equipment_owneridToUser;
      
      if (!owner.stripeconnectaccountid) {
        throw new Error('Owner does not have a Stripe Connect account');
      }

      // Calculate platform fee (10% of rental amount)
      const rentalAmount = rental.totalamount;
      const platformFeePercent = 0.10;
      const platformFee = Math.round(rentalAmount * platformFeePercent * 100) / 100;
      const ownerAmount = Math.round((rentalAmount - platformFee) * 100); // Convert to cents

      // Create a transfer to the owner's Connect account
      const transfer = await stripe.transfers.create({
        amount: ownerAmount,
        currency: rental.Payment?.currency?.toLowerCase() || 'usd',
        destination: owner.stripeconnectaccountid,
        transfer_group: rentalId,
        metadata: {
          rentalId,
          equipmentId: rental.equipmentid,
          ownerId: owner.id,
          platformFee: platformFee.toString()
        }
      });

      // Update the rental record with payout information
      await db.rental.update({
        where: { id: rentalId },
        data: {
          payoutstatus: 'COMPLETED',
          payoutamount: ownerAmount / 100, // Convert back to dollars
          payoutdate: new Date(),
          updatedat: new Date()
        }
      });

      // Create notification for the owner
      await createNotification(
        owner.id,
        'Payout Processed',
        `Your payout of ${(ownerAmount / 100).toFixed(2)} for rental ${rentalId} has been processed.`,
        'PAYOUT_PROCESSED'
      );

      return { transfer, rental };
    } catch (error) {
      logger.error('Error processing owner payout:', error);
      throw error;
    }
  }
}