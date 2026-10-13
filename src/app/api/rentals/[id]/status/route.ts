import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/auth-utils';

const schema = z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const result = schema.safeParse(await req.json().catch(() => null));
  if (!result.success) return NextResponse.json({ message: 'Invalid rental status' }, { status: 400 });
  const { id } = await params;

  try {
    const rental = await db.rental.findUnique({
      where: { id },
      include: { equipment: { select: { ownerId: true } }, payment: { select: { status: true, stripePaymentIntentId: true } } },
    });
    if (!rental) return NextResponse.json({ message: 'Rental not found' }, { status: 404 });

    const isOwner = rental.equipment.ownerId === user.id;
    const isRenter = rental.renterId === user.id;
    if (!isOwner && !isRenter) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const target = result.data.status;
    const valid = (target === 'CANCELLED' && rental.status === 'PENDING' && !rental.payment?.stripePaymentIntentId && (isOwner || isRenter)) ||
      (target === 'ACTIVE' && isOwner && rental.status === 'PAID' && rental.payment?.status === 'COMPLETED') ||
      (target === 'COMPLETED' && isOwner && rental.status === 'ACTIVE' && rental.payment?.status === 'COMPLETED');

    if (!valid) return NextResponse.json({ message: 'Invalid status transition. Paid cancellations require refund review.' }, { status: 409 });

    const changed = await db.rental.updateMany({
      where: { id, status: rental.status },
      data: { status: target },
    });
    if (changed.count !== 1) return NextResponse.json({ message: 'Rental was updated elsewhere. Refresh and retry.' }, { status: 409 });
    return NextResponse.json({ success: true, status: target });
  } catch (error) {
    console.error('Rental status update failed', error);
    return NextResponse.json({ message: 'Unable to update rental' }, { status: 500 });
  }
}
