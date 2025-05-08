import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment';
import logger from '@/lib/logger';
import { db } from '@/lib/db';
import { RentalStatus } from '@prisma/client';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Helper to verify Stripe webhook signatures
export const verifyStripeSignature = async (req: Request, secret: string) => {
  const text = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('No signature found in request');
  }

  try {
    const event = stripe.webhooks.constructEvent(text, signature, secret);
    return { event, rawBody: text };
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
};

// Handle different types of Stripe events
export const handleStripeEvent = async (event: Stripe.Event) => {
  const eventType = event.type;
  logger.info(`Processing Stripe webhook event: ${eventType}`);

  try {
    switch (eventType) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        
      case 'charge.refunded':
        return await handleChargeRefunded(event.data.object as Stripe.Charge);
        
      case 'setup_intent.succeeded':
        return await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        
      case 'payment_intent.canceled':
        return await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.requires_action':
        return await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.amount_capturable_updated':
        return await handlePaymentIntentCapturableUpdated(event.data.object as Stripe.PaymentIntent);
        
      case 'account.updated':
        return await handleConnectAccountUpdated(event.data.object as Stripe.Account);
        
      case 'payout.created':
      case 'payout.paid':
      case 'payout.failed':
        return await handlePayoutEvent(event.data.object as Stripe.Payout, eventType);
        
      case 'customer.created':
      case 'customer.updated':
      case 'customer.deleted':
        // Handle customer events here
        return { success: true, message: `Customer event ${eventType} processed` };
        
      default:
        logger.warn(`Unhandled Stripe webhook event: ${eventType}`);
        return { success: false, message: `Unhandled event type: ${eventType}` };
    }
  } catch (error: any) {
    logger.error(`Error processing Stripe webhook: ${error.message}`, error);
    throw error;
  }
};

// Helper functions to handle specific events

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment succeeded: ${paymentIntent.id}`);
  
  try {
    const result = await PaymentService.handlePaymentSuccess(paymentIntent.id);
    
    // If this payment is associated with a rental, update the rental status
    if (paymentIntent.metadata.rentalId) {
      try {
        await db.rental.update({
          where: { id: paymentIntent.metadata.rentalId },
          data: { 
            status: RentalStatus.PAID,
            paidat: new Date(),
            updatedat: new Date()
          }
        });
        
        logger.info(`Updated rental ${paymentIntent.metadata.rentalId} to PAID status`);
      } catch (err) {
        logger.error(`Failed to update rental status: ${err}`);
        // Continue processing even if rental update fails
      }
    }
    
    return { 
      success: true, 
      message: 'Payment processed successfully',
      payment: result.payment 
    };
  } catch (error: any) {
    logger.error(`Error processing successful payment: ${error.message}`, error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment failed: ${paymentIntent.id}`);
  
  try {
    const result = await PaymentService.handlePaymentFailure(paymentIntent.id);
    
    // If this payment is associated with a rental, update the rental status
    if (paymentIntent.metadata.rentalId) {
      try {
        await db.rental.update({
          where: { id: paymentIntent.metadata.rentalId },
          data: { 
            status: RentalStatus.PAYMENT_FAILED,
            updatedat: new Date()
          }
        });
        
        logger.info(`Updated rental ${paymentIntent.metadata.rentalId} to PAYMENT_FAILED status`);
      } catch (err) {
        logger.error(`Failed to update rental status: ${err}`);
        // Continue processing even if rental update fails
      }
    }
    
    return { 
      success: true, 
      message: 'Payment failure recorded',
      payment: result.payment 
    };
  } catch (error: any) {
    logger.error(`Error processing failed payment: ${error.message}`, error);
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info(`Charge refunded: ${charge.id}`);
  
  if (!charge.payment_intent) {
    logger.error('No payment intent associated with this charge');
    throw new Error('No payment intent associated with this charge');
  }
  
  const paymentIntentId = typeof charge.payment_intent === 'string' 
    ? charge.payment_intent 
    : charge.payment_intent.id;
  
  try {
    // Retrieve the payment intent to check if this is a security deposit refund
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadata = paymentIntent.metadata;
    
    let result;
    
    // Check if this is a security deposit refund
    if (metadata.hasSecurityDeposit === 'true' && metadata.securityDepositAmount) {
      // This is a security deposit refund
      result = await PaymentService.refundSecurityDeposit(paymentIntentId, charge.amount_refunded);
      logger.info(`Security deposit refunded for payment ${paymentIntentId}`);
    } else {
      // This is a regular refund
      result = await PaymentService.refundPayment(paymentIntentId, charge.amount_refunded);
      logger.info(`Payment refunded for payment ${paymentIntentId}`);
      
      // If this payment is associated with a rental, update the rental status
      if (metadata.rentalId) {
        try {
          await db.rental.update({
            where: { id: metadata.rentalId },
            data: { 
              status: RentalStatus.REFUNDED,
              refundedat: new Date(),
              updatedat: new Date()
            }
          });
          
          logger.info(`Updated rental ${metadata.rentalId} to REFUNDED status`);
        } catch (err) {
          logger.error(`Failed to update rental status: ${err}`);
          // Continue processing even if rental update fails
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Refund processed successfully',
      payment: result.payment 
    };
  } catch (error: any) {
    logger.error(`Error processing refund: ${error.message}`, error);
    throw error;
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  logger.info(`Setup intent succeeded: ${setupIntent.id}`);
  
  // Save the payment method to the user's account for future use
  if (setupIntent.metadata.userId) {
    try {
      // Get the payment method
      const paymentMethod = setupIntent.payment_method;
      
      if (paymentMethod && typeof paymentMethod === 'string') {
        // Update user with the payment method ID
        await db.user.update({
          where: { id: setupIntent.metadata.userId },
          data: { 
            stripepaymentmethodid: paymentMethod,
            updatedat: new Date()
          }
        });
        
        logger.info(`Saved payment method ${paymentMethod} for user ${setupIntent.metadata.userId}`);
      }
    } catch (err) {
      logger.error(`Failed to save payment method: ${err}`);
      // Continue processing even if payment method save fails
    }
  }
  
  return { 
    success: true, 
    message: 'Setup intent processed successfully',
    setupIntentId: setupIntent.id 
  };
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment intent canceled: ${paymentIntent.id}`);
  
  try {
    const result = await PaymentService.blockPayment(paymentIntent.id, 'Payment canceled');
    
    // If this payment is associated with a rental, update the rental status
    if (paymentIntent.metadata.rentalId) {
      try {
        await db.rental.update({
          where: { id: paymentIntent.metadata.rentalId },
          data: { 
            status: RentalStatus.PAYMENT_FAILED,
            updatedat: new Date()
          }
        });
        
        logger.info(`Updated rental ${paymentIntent.metadata.rentalId} to PAYMENT_FAILED status`);
      } catch (err) {
        logger.error(`Failed to update rental status: ${err}`);
        // Continue processing even if rental update fails
      }
    }
    
    return { 
      success: true, 
      message: 'Payment cancellation recorded',
      payment: result 
    };
  } catch (error: any) {
    logger.error(`Error processing canceled payment: ${error.message}`, error);
    throw error;
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment intent requires action: ${paymentIntent.id}`);
  
  // This event occurs when a payment requires additional authentication
  // We don't need to do anything here, but we log it for visibility
  
  return { 
    success: true, 
    message: 'Payment requires additional action',
    paymentIntentId: paymentIntent.id 
  };
}

async function handlePaymentIntentCapturableUpdated(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment intent capturable amount updated: ${paymentIntent.id}`);
  
  // This event occurs when a payment with manual capture has its capturable amount updated
  // This is relevant for security deposits
  
  if (paymentIntent.amount_capturable > 0 && 
      paymentIntent.metadata.hasSecurityDeposit === 'true' && 
      paymentIntent.metadata.rentalAmount) {
    
    try {
      // Capture only the rental amount, leaving the security deposit on hold
      const rentalAmount = parseInt(paymentIntent.metadata.rentalAmount) * 100; // Convert to cents
      
      await stripe.paymentIntents.capture(paymentIntent.id, {
        amount_to_capture: rentalAmount,
      });
      
      logger.info(`Captured rental amount ${rentalAmount} for payment ${paymentIntent.id}`);
      
      return { 
        success: true, 
        message: 'Rental amount captured successfully',
        paymentIntentId: paymentIntent.id 
      };
    } catch (error: any) {
      logger.error(`Error capturing rental amount: ${error.message}`, error);
      throw error;
    }
  }
  
  return { 
    success: true, 
    message: 'Payment capturable amount updated',
    paymentIntentId: paymentIntent.id 
  };
}

async function handleConnectAccountUpdated(account: Stripe.Account) {
  logger.info(`Connect account updated: ${account.id}`);
  
  // Update user's account details if metadata contains userId
  if (account.metadata && account.metadata.userId) {
    try {
      await db.user.update({
        where: { id: account.metadata.userId },
        data: { 
          stripeaccountverified: account.charges_enabled,
          updatedat: new Date()
        }
      });
      
      logger.info(`Updated user ${account.metadata.userId} with Stripe account verification status`);
    } catch (err) {
      logger.error(`Failed to update user with Stripe account status: ${err}`);
      // Continue processing even if user update fails
    }
  }
  
  return { 
    success: true, 
    message: 'Connect account update processed',
    accountId: account.id 
  };
}

async function handlePayoutEvent(payout: Stripe.Payout, eventType: string) {
  logger.info(`Payout event ${eventType}: ${payout.id}`);
  
  // Update payout status in the database if we have a record of it
  // This would require a payouts table, which might not exist yet
  
  return { 
    success: true, 
    message: `Payout event ${eventType} processed`,
    payoutId: payout.id 
  };
}

// Helper function to respond to a webhook request
export const respondToWebhook = (result: any, error?: any) => {
  if (error) {
    logger.error('Error in webhook handler', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ received: true, ...result });
};