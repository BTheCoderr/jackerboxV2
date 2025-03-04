import { loadStripe } from '@stripe/stripe-js';
import { functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Function to create a payment intent
export const createPaymentIntent = async (bookingData) => {
  try {
    const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
    const result = await createPaymentIntentFn({
      amount: bookingData.totalAmount,
      currency: 'usd',
      equipmentId: bookingData.equipmentId,
      rentalDuration: bookingData.rentalDuration,
      securityDeposit: bookingData.securityDeposit || 0,
      metadata: {
        equipmentName: bookingData.equipmentName,
        ownerId: bookingData.ownerId,
        renterId: bookingData.renterId
      }
    });
    
    return result.data;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

// Function to process a payment
export const processPayment = async (paymentMethodId, paymentIntentId) => {
  try {
    const processPaymentFn = httpsCallable(functions, 'processPayment');
    const result = await processPaymentFn({
      paymentMethodId,
      paymentIntentId
    });
    
    return result.data;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

// Function to handle security deposit
export const handleSecurityDeposit = async (bookingId, action, amount = null) => {
  try {
    const handleDepositFn = httpsCallable(functions, 'handleSecurityDeposit');
    const result = await handleDepositFn({
      bookingId,
      action, // 'hold', 'charge', 'release'
      amount
    });
    
    return result.data;
  } catch (error) {
    console.error("Error handling security deposit:", error);
    throw error;
  }
};

// Function to process owner payout
export const processOwnerPayout = async (bookingId) => {
  try {
    const processPayoutFn = httpsCallable(functions, 'processOwnerPayout');
    const result = await processPayoutFn({
      bookingId
    });
    
    return result.data;
  } catch (error) {
    console.error("Error processing owner payout:", error);
    throw error;
  }
};

export { stripePromise }; 