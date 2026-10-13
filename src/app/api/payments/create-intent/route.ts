import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

const schema = z.object({
  rentalId: z.string().min(1),
  paymentId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payment request' }, { status: 400 });

  try {
    const { rentalId, paymentId } = parsed.data;
    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: { payment: true, equipment: { select: { title: true } } },
    });
    if (!rental || rental.renterId !== user.id || !rental.payment || rental.payment.id !== paymentId) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }
    if (rental.status !== 'PENDING' || rental.payment.status !== 'PENDING' ||
        Date.now() - rental.createdAt.getTime() > 30 * 60 * 1000) {
      return NextResponse.json({ message: 'This rental is no longer eligible for payment' }, { status: 409 });
    }

    // Never accept a price, currency or deposit from the browser.
    const amount = Math.round((rental.totalPrice + (rental.securityDeposit ?? 0)) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999) {
      return NextResponse.json({ message: 'Invalid rental amount' }, { status: 400 });
    }
    const cents = formatAmountForStripe(amount, 'USD');

    if (rental.payment.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(rental.payment.stripePaymentIntentId);
      if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation' ||
          existing.status === 'requires_action') {
        if (existing.amount === cents && existing.currency === 'usd' && existing.client_secret) {
          return NextResponse.json({ clientSecret: existing.client_secret, paymentId });
        }
      }
      return NextResponse.json({ message: 'Payment already initiated. Contact support if you cannot complete it.' }, { status: 409 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      metadata: {
        rentalId, paymentId, equipmentId: rental.equipmentId,
        rentalAmount: rental.totalPrice.toFixed(2),
        securityDepositAmount: (rental.securityDeposit ?? 0).toFixed(2),
      },
    }, { idempotencyKey: `rental-${rentalId}-payment-${paymentId}-v1` });

    await db.payment.update({
      where: { id: paymentId },
      data: { stripePaymentIntentId: intent.id, amount, currency: 'USD' },
    });
    return NextResponse.json({ clientSecret: intent.client_secret, paymentId });
  } catch (error) {
    console.error('Payment initialization failed', error);
    return NextResponse.json({ message: 'Unable to initialize payment' }, { status: 500 });
  }
}
