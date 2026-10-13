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
      include: { payment: true, equipment: { include: { owner: true } } },
    });
    if (!rental || rental.status !== 'COMPLETED' || rental.payment?.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Rental and payment must both be completed' }, { status: 409 });
    }
    const ownerAccount = rental.equipment.owner.stripeConnectAccountId;
    if (!ownerAccount) return NextResponse.json({ error: 'Owner needs a Stripe Connect account' }, { status: 409 });

    const previous = rental.payment.metadata && typeof rental.payment.metadata === 'object' && !Array.isArray(rental.payment.metadata)
      ? rental.payment.metadata : {};
    if ('ownerPayoutTransferId' in previous || 'legacyOwnerPayoutRecorded' in previous) {
      return NextResponse.json({ error: 'Owner payout already recorded' }, { status: 409 });
    }

    // Exclude the refundable security deposit from the owner payout.
    const feeCents = Math.round(rental.totalPrice * 100 * 0.10);
    const ownerCents = Math.round(rental.totalPrice * 100) - feeCents;
    if (ownerCents <= 0) return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });

    const transfer = await stripe.transfers.create({
      amount: ownerCents,
      currency: 'usd',
      destination: ownerAccount,
      transfer_group: `RENTAL_${rental.id}`,
      metadata: { rentalId: rental.id, paymentId: rental.payment.id },
    }, { idempotencyKey: `jackerbox-owner-transfer-${rental.id}-v1` });

    await db.payment.update({
      where: { id: rental.payment.id },
      data: { metadata: {
        ...previous,
        ownerPayoutTransferId: transfer.id,
        ownerPayoutCents: ownerCents,
        platformFeeCents: feeCents,
      } },
    });
    return NextResponse.json({ success: true, transferId: transfer.id });
  } catch (error) {
    console.error('Owner payout failed', error);
    return NextResponse.json({ error: 'Payout failed. Review Stripe before retrying.' }, { status: 500 });
  }
}
