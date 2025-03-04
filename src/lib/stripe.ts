import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion, // Use the latest supported API version
  appInfo: {
    name: 'Jackerbox',
    version: '1.0.0',
  },
});

export const formatAmountForStripe = (
  amount: number,
  currency: string
): number => {
  const currencies = ['USD', 'EUR', 'GBP'];
  const multiplier = currencies.includes(currency.toUpperCase()) ? 100 : 1;
  return Math.round(amount * multiplier);
};

export const formatAmountFromStripe = (
  amount: number,
  currency: string
): number => {
  const currencies = ['USD', 'EUR', 'GBP'];
  const divider = currencies.includes(currency.toUpperCase()) ? 100 : 1;
  return amount / divider;
};

/**
 * Process a refund for a security deposit
 * @param paymentIntentId The ID of the payment intent to refund
 * @param amount The amount to refund (in the smallest currency unit, e.g. cents)
 * @param reason The reason for the refund
 * @returns The refund object
 */
export const processSecurityDepositRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If undefined, refunds the full amount
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
    });
    
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Create a Stripe Identity Verification Session
 * @param userId The ID of the user to verify
 * @returns The verification session
 */
export const createIdentityVerificationSession = async (
  userId: string,
  returnUrl: string
): Promise<Stripe.Identity.VerificationSession> => {
  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId,
      },
      options: {
        document: {
          require_id_number: true,
          require_matching_selfie: true,
        },
      },
      return_url: returnUrl,
    });
    
    return verificationSession;
  } catch (error) {
    console.error('Error creating identity verification session:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe Identity Verification Session
 * @param sessionId The ID of the verification session to retrieve
 * @returns The verification session
 */
export const retrieveIdentityVerificationSession = async (
  sessionId: string
): Promise<Stripe.Identity.VerificationSession> => {
  try {
    const verificationSession = await stripe.identity.verificationSessions.retrieve(
      sessionId
    );
    
    return verificationSession;
  } catch (error) {
    console.error('Error retrieving identity verification session:', error);
    throw error;
  }
}; 