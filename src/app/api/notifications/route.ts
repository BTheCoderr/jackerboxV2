import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to 20 most recent notifications
    });

    return NextResponse.json({
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse('Error fetching notifications', { status: 500 });
  }
} 