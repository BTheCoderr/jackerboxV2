import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function verifyStripeSignature(request: Request): Promise<Stripe.Event> {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

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

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            metadata: paymentIntent.metadata as any,
          },
        });
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.update({
          where: { stripePaymentIntentId: failedPayment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            blockReason: failedPayment.last_payment_error?.message,
          },
        });
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Refund;
        const paymentIntentId = (refund.payment_intent as string);
        await prisma.payment.update({
          where: { stripePaymentIntentId: paymentIntentId },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });
        break;

      // Identity verification events
      case 'identity.verification_session.verified':
        const verificationSession = event.data.object as Stripe.Identity.VerificationSession;
        if (verificationSession.metadata?.userId) {
          await prisma.user.update({
            where: { id: verificationSession.metadata.userId },
            data: {
              idVerified: true,
              idVerificationStatus: 'VERIFIED',
              idVerificationDate: new Date(),
            },
          });
        }
        break;

      case 'identity.verification_session.requires_input':
        const pendingSession = event.data.object as Stripe.Identity.VerificationSession;
        if (pendingSession.metadata?.userId) {
          await prisma.user.update({
            where: { id: pendingSession.metadata.userId },
            data: {
              idVerificationStatus: 'PENDING_INPUT',
            },
          });
        }
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 