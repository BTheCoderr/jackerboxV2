import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '../../../../prisma/generated/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { calculateRentalPrice } from '@/lib/rentals/pricing';

const DAY = 24 * 60 * 60 * 1000;
const PENDING_HOLD_MS = 30 * 60 * 1000;
const requestSchema = z.object({
  equipmentId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  rentalType: z.enum(['hourly', 'daily', 'weekly']),
});

class ConflictError extends Error {}

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rentals = await db.rental.findMany({
      where: { OR: [{ renterId: user.id }, { equipment: { ownerId: user.id } }] },
      include: {
        equipment: { select: { title: true, category: true, hourlyRate: true, dailyRate: true, imagesJson: true } },
        renter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rentals);
  } catch (error) {
    console.error('Rentals list failed', error);
    return NextResponse.json({ error: 'Unable to load rentals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid rental request' }, { status: 400 });

  const { equipmentId, startDate, endDate, rentalType } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      start < todayUtc || end <= start || end.getTime() - start.getTime() > 90 * DAY) {
    return NextResponse.json({ message: 'Choose valid rental dates within the next 90-day rental period' }, { status: 400 });
  }

  try {
    // Serializable isolation prevents concurrent requests from both accepting an overlapping interval.
    const rental = await db.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { id: equipmentId } });
      if (!equipment || !equipment.isAvailable || equipment.moderationStatus !== 'APPROVED') {
        throw new ConflictError('This equipment is not available for booking');
      }
      if (equipment.ownerId === user.id) throw new ConflictError('You cannot rent your own equipment');

      const rate = rentalType === 'hourly' ? equipment.hourlyRate
        : rentalType === 'weekly' ? equipment.weeklyRate : equipment.dailyRate;
      if (rate == null || !Number.isFinite(rate) || rate <= 0) {
        throw new ConflictError('The selected rental rate is unavailable');
      }
      const totalPrice = calculateRentalPrice(rate, start, end, rentalType);
      if (!Number.isFinite(totalPrice) || totalPrice <= 0) throw new ConflictError('Invalid rental price');

      // Block date-level blackout days, including any part of the requested rental window.
      if (equipment.blackoutDates.some((d) => {
        const blackout = new Date(d);
        const dateOnly = new Date(Date.UTC(blackout.getUTCFullYear(), blackout.getUTCMonth(), blackout.getUTCDate()));
        return dateOnly < end && new Date(dateOnly.getTime() + DAY) > start;
      })) throw new ConflictError('These dates include unavailable equipment days');

      const overlap = await tx.rental.findFirst({
        where: {
          equipmentId,
          startDate: { lt: end },
          endDate: { gt: start },
          OR: [
            { status: { in: ['PAID', 'ACTIVE'] } },
            { status: 'PENDING', createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MS) } },
          ],
        },
        select: { id: true },
      });
      if (overlap) throw new ConflictError('These dates are already reserved');

      return tx.rental.create({
        data: {
          equipmentId,
          renterId: user.id,
          startDate: start,
          endDate: end,
          totalPrice,
          securityDeposit: Math.max(0, equipment.securityDeposit ?? 0),
          status: 'PENDING',
        },
        include: { equipment: { select: { title: true, category: true } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ rental }, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034')) {
      return NextResponse.json({ message: error instanceof ConflictError ? error.message : 'Booking conflicted with another request. Please retry.' }, { status: 409 });
    }
    console.error('Rental creation failed', error);
    return NextResponse.json({ message: 'Unable to create rental' }, { status: 500 });
  }
}
