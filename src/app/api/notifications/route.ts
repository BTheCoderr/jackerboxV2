import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await db.notification.count({
      where: {
        userId: currentUser.id,
      },
    });

    // Get paginated notifications
    const notifications = await db.notification.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        data: true,
        read: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({ 
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications", notifications: [] },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { userId, type, title, message, linkUrl } = await req.json();
    
    // Validate required fields
    if (!userId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create the notification with data field containing the message details
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        data: {
          title,
          message,
          linkUrl
        },
        read: false,
      },
    });
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
} 