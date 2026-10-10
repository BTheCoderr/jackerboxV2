import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

const schema = z.object({ rentalId: z.string().min(1) });

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const rental = await db.rental.findUnique({
      where: { id: parsed.data.rentalId },
      include: { payment: true },
    });
    if (!rental || rental.status !== 'COMPLETED' ||
        !rental.payment || rental.payment.status !== 'COMPLETED' ||
        !rental.payment.stripePaymentIntentId) {
      return NextResponse.json({ error: 'Rental must be completed and paid before deposit return' }, { status: 409 });
    }
    const depositCents = Math.round((rental.securityDeposit ?? 0) * 100);
    if (depositCents <= 0) return NextResponse.json({ error: 'No security deposit' }, { status: 409 });

    const previous = rental.payment.metadata && typeof rental.payment.metadata === 'object' && !Array.isArray(rental.payment.metadata)
      ? rental.payment.metadata : {};
    if ('securityDepositRefundId' in previous) {
      return NextResponse.json({ error: 'Deposit refund already recorded' }, { status: 409 });
    }

    const refund = await stripe.refunds.create({
      payment_intent: rental.payment.stripePaymentIntentId,
      amount: depositCents,
    }, { idempotencyKey: `jackerbox-security-deposit-${rental.id}-v1` });

    await db.payment.update({
      where: { id: rental.payment.id },
      data: { metadata: { ...previous, securityDepositRefundId: refund.id, securityDepositRefundCents: depositCents } },
    });
    return NextResponse.json({ success: true, refundId: refund.id, amount: depositCents / 100 });
  } catch (error) {
    console.error('Security deposit refund failed', error);
    return NextResponse.json({ error: 'Refund failed. Review Stripe before retrying.' }, { status: 500 });
  }
}
