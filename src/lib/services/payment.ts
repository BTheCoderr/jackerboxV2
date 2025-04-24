import Stripe from 'stripe';
import logger from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

export const PaymentService = {
  handlePaymentSuccess: async (paymentIntentId: string) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      logger.info('Payment succeeded:', paymentIntent.id);
      // Add your payment success logic here
      return paymentIntent;
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  },

  handlePaymentFailure: async (paymentIntentId: string) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      logger.error('Payment failed:', paymentIntent.id);
      // Add your payment failure logic here
      return paymentIntent;
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  },

  refundPayment: async (chargeId: string) => {
    try {
      const refund = await stripe.refunds.create({
        charge: chargeId,
      });
      logger.info('Payment refunded:', refund.id);
      return refund;
    } catch (error) {
      logger.error('Error refunding payment:', error);
      throw error;
    }
  },

  createPaymentIntent: async (amount: number, currency: string = 'usd') => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
      });
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  },

  updatePaymentIntent: async (paymentIntentId: string, updateData: Stripe.PaymentIntentUpdateParams) => {
    try {
      const paymentIntent = await stripe.paymentIntents.update(
        paymentIntentId,
        updateData
      );
      logger.info('Payment intent updated:', paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      logger.error('Error updating payment intent:', error);
      throw error;
    }
  }
}; 