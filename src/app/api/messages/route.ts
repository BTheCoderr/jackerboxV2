import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

const sendSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  rentalId: z.string().optional(),
  equipmentId: z.string().optional(),
  receiverId: z.string().optional(),
  recipientId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const otherId = request.nextUrl.searchParams.get('otherUserId');
  const where = otherId ? {
    OR: [
      { senderId: user.id, recipientId: otherId },
      { senderId: otherId, recipientId: user.id },
    ],
  } : {
    OR: [{ senderId: user.id }, { recipientId: user.id }],
  };
  try {
    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return NextResponse.json({ messages: messages.map(m => ({
      ...m,
      receiverId: m.recipientId, // Backward compatibility for the current chat component
      isRead: true, // Read receipts need a separate DB migration; do not invent unread counters
      attachments: [],
    })) });
  } catch (error) {
    console.error('Unable to list messages', error);
    return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid message' }, { status: 400 });

  try {
    const data = parsed.data;
    let equipmentId = data.equipmentId;
    let recipientId = data.recipientId || data.receiverId;
    if (data.rentalId) {
      const rental = await db.rental.findUnique({
        where: { id: data.rentalId },
        include: { equipment: { select: { ownerId: true } } },
      });
      if (!rental || (rental.renterId !== user.id && rental.equipment.ownerId !== user.id)) {
        return NextResponse.json({ message: 'Rental not found' }, { status: 404 });
      }
      equipmentId = rental.equipmentId;
      recipientId = user.id === rental.renterId ? rental.equipment.ownerId : rental.renterId;
    }
    if (!equipmentId || !recipientId || recipientId === user.id) {
      return NextResponse.json({ message: 'Recipient and equipment are required' }, { status: 400 });
    }
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId }, select: { ownerId: true },
    });
    if (!equipment || (equipment.ownerId !== user.id && recipientId !== equipment.ownerId)) {
      return NextResponse.json({ message: 'Forbidden for this equipment' }, { status: 403 });
    }
    const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { id: true } });
    if (!recipient) return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });

    const message = await db.message.create({
      data: { senderId: user.id, recipientId, equipmentId, content: data.content },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ message: {
      ...message, receiverId: message.recipientId, isRead: true, attachments: [],
    } }, { status: 201 });
  } catch (error) {
    console.error('Unable to send message', error);
    return NextResponse.json({ message: 'Unable to send message' }, { status: 500 });
  }
}
