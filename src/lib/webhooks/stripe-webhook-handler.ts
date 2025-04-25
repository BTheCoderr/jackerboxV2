import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment';
import logger from '@/lib/logger';
import { db } from '@/lib/db';

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
    const result = await PaymentService.refundPayment(paymentIntentId);
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
  
  // Example of handling setup intents for saving payment methods
  // You can customize this based on your application needs
  return { 
    success: true, 
    message: 'Setup intent processed successfully',
    setupIntentId: setupIntent.id 
  };
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment intent canceled: ${paymentIntent.id}`);
  
  try {
    // You might want to implement a specific method in PaymentService for this
    // For now we'll use the block payment feature
    const result = await PaymentService.blockPayment(paymentIntent.id);
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