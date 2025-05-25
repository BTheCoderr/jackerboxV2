import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { recipientId, equipmentId, message } = body;

    if (!recipientId || !equipmentId || !message) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        equipmentId,
        content: message,
      },
    });

    // Notify recipient through WebSocket if online
    // This will be handled by the socket server

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 