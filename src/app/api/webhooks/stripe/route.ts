import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook signature is required' }, { status: 400 });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const payment = await db.payment.findUnique({ where: { stripePaymentIntentId: intent.id } });
      if (!payment || !payment.rentalId || payment.id !== intent.metadata.paymentId) {
        // An unknown payment should not be falsely marked as completed.
        throw new Error('Payment record missing or metadata mismatch');
      }
      if (intent.amount !== Math.round(payment.amount * 100) || intent.currency !== 'usd') {
        throw new Error('Stripe payment amount does not match the stored charge');
      }

      if (payment.status === 'COMPLETED') return NextResponse.json({ received: true });

      // A payment confirmed after a reservation expired or after another rental
      // took the same dates must be returned, not activated as a double booking.
      const rental = await db.rental.findUnique({ where: { id: payment.rentalId } });
      if (!rental) throw new Error('Rental missing for paid intent');
      const confirmedAt = new Date(event.created * 1000);
      const expired = confirmedAt.getTime() - rental.createdAt.getTime() > 30 * 60 * 1000;
      const conflicting = await db.rental.findFirst({
        where: {
          id: { not: rental.id },
          equipmentId: rental.equipmentId,
          startDate: { lt: rental.endDate },
          endDate: { gt: rental.startDate },
          status: { in: ['PAID', 'ACTIVE'] },
        },
        select: { id: true },
      });
      if (rental.status !== 'PENDING' || expired || conflicting) {
        await stripe.refunds.create({ payment_intent: intent.id }, {
          idempotencyKey: `jackerbox-invalid-booking-${intent.id}`,
        });
        await db.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
        await db.rental.updateMany({ where: { id: rental.id, status: 'PENDING' }, data: { status: 'REFUNDED' } });
        return NextResponse.json({ received: true });
      }

      await db.$transaction(async (tx) => {
        const conflict = await tx.rental.findFirst({
          where: {
            id: { not: rental.id },
            equipmentId: rental.equipmentId,
            startDate: { lt: rental.endDate },
            endDate: { gt: rental.startDate },
            status: { in: ['PAID', 'ACTIVE'] },
          },
          select: { id: true },
        });
        if (conflict) throw new Error('Booking conflict during payment confirmation');
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', paidAt: confirmedAt, metadata: intent.metadata },
        });
        const result = await tx.rental.updateMany({
          where: { id: rental.id, status: 'PENDING' },
          data: { status: 'PAID' },
        });
        if (result.count !== 1) throw new Error('Rental state changed during payment confirmation');
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const payment = await db.payment.findUnique({ where: { stripePaymentIntentId: intent.id } });
      if (payment && payment.status !== 'COMPLETED') {
        await db.$transaction(async (tx) => {
          await tx.payment.update({ where: { id: payment.id }, data: {
            status: 'FAILED', failedAt: new Date(), blockReason: intent.last_payment_error?.message,
          } });
          if (payment.rentalId) await tx.rental.updateMany({
            where: { id: payment.rentalId, status: 'PENDING' },
            data: { status: 'PAYMENT_FAILED' },
          });
        });
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (intentId) {
        const fullyRefunded = charge.amount_refunded >= charge.amount;
        await db.payment.updateMany({
          where: { stripePaymentIntentId: intentId },
          data: { refundedAt: new Date(), ...(fullyRefunded ? { status: 'REFUNDED' as const } : {}) },
        });
      }
    } else if (event.type === 'identity.verification_session.verified') {
      const userId = event.data.object.metadata?.userId;
      if (userId) await db.user.updateMany({ where: { id: userId }, data: {
        idVerified: true, idVerificationStatus: 'VERIFIED', idVerificationDate: new Date(),
      } });
    } else if (event.type === 'identity.verification_session.requires_input') {
      const userId = event.data.object.metadata?.userId;
      if (userId) await db.user.updateMany({ where: { id: userId }, data: {
        idVerified: false, idVerificationStatus: 'PENDING_INPUT',
      } });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    // Stripe can retry a transient processing error.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
