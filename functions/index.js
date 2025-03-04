const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Create a payment intent
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Calculate platform fee (e.g., 10%)
    const platformFeePercentage = 0.10;
    const platformFee = Math.round(data.amount * platformFeePercentage);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || 'usd',
      metadata: {
        equipmentId: data.equipmentId,
        ownerId: data.metadata.ownerId,
        renterId: data.metadata.renterId,
        equipmentName: data.metadata.equipmentName,
        rentalDuration: data.rentalDuration,
        securityDeposit: data.securityDeposit,
        platformFee: platformFee
      },
      application_fee_amount: platformFee,
      transfer_data: {
        // This assumes the equipment owner has a connected Stripe account
        destination: await getOwnerStripeAccountId(data.metadata.ownerId),
      },
    });

    // Store payment intent in Firestore
    await admin.firestore().collection('paymentIntents').doc(paymentIntent.id).set({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: data.amount,
      currency: data.currency || 'usd',
      status: paymentIntent.status,
      equipmentId: data.equipmentId,
      ownerId: data.metadata.ownerId,
      renterId: data.metadata.renterId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      securityDeposit: data.securityDeposit,
      platformFee: platformFee
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Process payment
exports.processPayment = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(
      data.paymentIntentId,
      { payment_method: data.paymentMethodId }
    );

    // Update payment intent in Firestore
    await admin.firestore().collection('paymentIntents').doc(data.paymentIntentId).update({
      status: paymentIntent.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, status: paymentIntent.status };
  } catch (error) {
    console.error("Error processing payment:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Handle security deposit
exports.handleSecurityDeposit = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const bookingRef = admin.firestore().collection('bookings').doc(data.bookingId);
    const booking = await bookingRef.get();
    
    if (!booking.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }
    
    const bookingData = booking.data();
    
    switch (data.action) {
      case 'hold':
        // Create a hold on the security deposit
        const paymentIntent = await stripe.paymentIntents.create({
          amount: bookingData.securityDeposit,
          currency: 'usd',
          customer: bookingData.stripeCustomerId,
          setup_future_usage: 'off_session',
          metadata: {
            bookingId: data.bookingId,
            type: 'securityDeposit'
          },
          capture_method: 'manual'
        });
        
        await bookingRef.update({
          securityDepositStatus: 'held',
          securityDepositId: paymentIntent.id
        });
        
        return { success: true, depositId: paymentIntent.id };
        
      case 'charge':
        // Charge the security deposit (in case of damage)
        if (!bookingData.securityDepositId) {
          throw new functions.https.HttpsError('failed-precondition', 'No security deposit held');
        }
        
        const chargeAmount = data.amount || bookingData.securityDeposit;
        
        await stripe.paymentIntents.capture(bookingData.securityDepositId, {
          amount_to_capture: chargeAmount
        });
        
        await bookingRef.update({
          securityDepositStatus: 'charged',
          securityDepositChargeAmount: chargeAmount
        });
        
        return { success: true };
        
      case 'release':
        // Release the security deposit
        if (!bookingData.securityDepositId) {
          throw new functions.https.HttpsError('failed-precondition', 'No security deposit held');
        }
        
        await stripe.paymentIntents.cancel(bookingData.securityDepositId);
        
        await bookingRef.update({
          securityDepositStatus: 'released',
          securityDepositId: null
        });
        
        return { success: true };
        
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }
  } catch (error) {
    console.error("Error handling security deposit:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Process owner payout
exports.processOwnerPayout = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is admin (you should implement this check)
  const isAdmin = await checkIfUserIsAdmin(context.auth.uid);
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can process payouts');
  }

  try {
    const bookingRef = admin.firestore().collection('bookings').doc(data.bookingId);
    const booking = await bookingRef.get();
    
    if (!booking.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }
    
    const bookingData = booking.data();
    
    // Get owner's connected account ID
    const ownerStripeAccountId = await getOwnerStripeAccountId(bookingData.ownerId);
    
    // Calculate owner's payout amount (total minus platform fee)
    const platformFeePercentage = 0.10;
    const platformFee = Math.round(bookingData.totalAmount * platformFeePercentage);
    const payoutAmount = bookingData.totalAmount - platformFee;
    
    // Create a transfer to the owner's connected account
    const transfer = await stripe.transfers.create({
      amount: payoutAmount,
      currency: 'usd',
      destination: ownerStripeAccountId,
      transfer_group: data.bookingId,
      metadata: {
        bookingId: data.bookingId,
        equipmentId: bookingData.equipmentId,
        ownerId: bookingData.ownerId,
        renterId: bookingData.renterId
      }
    });
    
    // Update booking with payout information
    await bookingRef.update({
      payoutStatus: 'completed',
      payoutId: transfer.id,
      payoutAmount: payoutAmount,
      payoutDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, transferId: transfer.id };
  } catch (error) {
    console.error("Error processing owner payout:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to get owner's Stripe account ID
async function getOwnerStripeAccountId(ownerId) {
  const ownerDoc = await admin.firestore().collection('users').doc(ownerId).get();
  
  if (!ownerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Owner not found');
  }
  
  const ownerData = ownerDoc.data();
  
  if (!ownerData.stripeAccountId) {
    throw new functions.https.HttpsError('failed-precondition', 'Owner has no connected Stripe account');
  }
  
  return ownerData.stripeAccountId;
}

// Helper function to check if user is admin
async function checkIfUserIsAdmin(userId) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return false;
  }
  
  const userData = userDoc.data();
  return userData.role === 'admin';
} 