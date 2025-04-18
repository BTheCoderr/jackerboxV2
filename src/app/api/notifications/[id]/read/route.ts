import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use params.id directly without awaiting
    const notificationId = params.id;

    // Verify the notification belongs to the current user
    const notification = await db.notification.findUnique({
      where: {
        id: notificationId,
        userId: currentUser.id,
      },
    });

    if (!notification) {
      return new NextResponse('Notification not found', { status: 404 });
    }

    // Mark the notification as read
    await db.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return new NextResponse('Error marking notification as read', { status: 500 });
  }
} 