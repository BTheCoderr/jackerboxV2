import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

async function verifyStripeSignature(request: Request): Promise<Stripe.Event> {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    throw new Error('No Stripe signature found');
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export async function POST(request: Request) {
  try {
    const event = await verifyStripeSignature(request);
    
    console.log(`📦 Received Stripe webhook: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        try {
          await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              metadata: paymentIntent.metadata as any,
            },
          });
          console.log(`✅ Payment ${paymentIntent.id} marked as completed`);
        } catch (updateError: any) {
          if (updateError.code === 'P2025') {
            // Payment record not found - this is normal for test webhooks
            console.log(`⚠️ Payment record not found for ${paymentIntent.id} (test webhook)`);
          } else {
            console.error(`❌ Error updating payment ${paymentIntent.id}:`, updateError);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        try {
          await prisma.payment.update({
            where: { stripePaymentIntentId: failedPayment.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              blockReason: failedPayment.last_payment_error?.message,
            },
          });
          console.log(`❌ Payment ${failedPayment.id} marked as failed`);
        } catch (updateError: any) {
          if (updateError.code === 'P2025') {
            console.log(`⚠️ Payment record not found for ${failedPayment.id} (test webhook)`);
          } else {
            console.error(`❌ Error updating failed payment ${failedPayment.id}:`, updateError);
          }
        }
        break;

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = (charge.payment_intent as string);
        try {
          await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntentId },
            data: {
              status: 'REFUNDED',
              refundedAt: new Date(),
            },
          });
          console.log(`🔄 Payment ${paymentIntentId} marked as refunded`);
        } catch (updateError: any) {
          if (updateError.code === 'P2025') {
            console.log(`⚠️ Payment record not found for refund ${paymentIntentId}`);
          } else {
            console.error(`❌ Error processing refund for ${paymentIntentId}:`, updateError);
          }
        }
        break;

      // Identity verification events - TEMPORARILY DISABLED FOR SIMPLIFIED ONBOARDING
      case 'identity.verification_session.verified':
        const verificationSession = event.data.object as Stripe.Identity.VerificationSession;
        if (verificationSession.metadata?.userId) {
          try {
            await prisma.user.update({
              where: { id: verificationSession.metadata.userId },
              data: {
                idVerified: true,
                idVerificationStatus: 'VERIFIED',
                idVerificationDate: new Date(),
              },
            });
            console.log(`✅ User ${verificationSession.metadata.userId} ID verified`);
          } catch (updateError: any) {
            if (updateError.code === 'P2025') {
              console.log(`⚠️ User not found for ID verification: ${verificationSession.metadata.userId}`);
            } else {
              console.error(`❌ Error updating user verification:`, updateError);
            }
          }
        }
        break;

      case 'identity.verification_session.requires_input':
        const pendingSession = event.data.object as Stripe.Identity.VerificationSession;
        if (pendingSession.metadata?.userId) {
          try {
            await prisma.user.update({
              where: { id: pendingSession.metadata.userId },
              data: {
                idVerificationStatus: 'PENDING_INPUT',
              },
            });
            console.log(`⏳ User ${pendingSession.metadata.userId} verification pending input`);
          } catch (updateError: any) {
            if (updateError.code === 'P2025') {
              console.log(`⚠️ User not found for verification update: ${pendingSession.metadata.userId}`);
            } else {
              console.error(`❌ Error updating user verification status:`, updateError);
            }
          }
        }
        break;

      default:
        console.log(`🤷 Unhandled Stripe event type: ${event.type}`);
        // Don't treat unknown events as errors - just log them
    }

    return NextResponse.json({ 
      received: true, 
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    
    // Don't return error status for signature verification issues during development
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.message.includes('signature')) {
      console.log('🚧 Development mode: Allowing webhook despite signature issues');
      return NextResponse.json({ 
        received: true, 
        error: 'Signature verification failed (development mode)',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
} 