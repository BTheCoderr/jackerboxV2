import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

// POST /api/notifications/sample - Generate sample notifications for the current user
export async function POST() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Clear existing notifications for this user
    await db.notification.deleteMany({
      where: {
        userId: currentUser.id,
      },
    });
    
    // Sample notification data
    const sampleNotifications = [
      {
        type: "RENTAL_BOOKED",
        data: {
          title: "New Rental Booking",
          message: "Someone has booked your camera equipment",
          propertyName: "Canon EOS 5D Mark IV",
          rentalId: "sample-rental-1",
          linkUrl: "/routes/dashboard",
        },
        read: false,
      },
      {
        type: "PAYMENT_RECEIVED",
        data: {
          title: "Payment Received",
          message: "You've received a payment for your rental",
          amount: 150,
          rentalId: "sample-rental-2",
          linkUrl: "/routes/dashboard/earnings",
        },
        read: false,
      },
      {
        type: "RENTAL_UPDATE",
        data: {
          title: "Rental Status Updated",
          message: "Your rental status has been updated to Approved",
          rentalId: "sample-rental-3",
          linkUrl: "/routes/dashboard",
        },
        read: true,
      },
      {
        type: "SECURITY_DEPOSIT_RETURNED",
        data: {
          title: "Security Deposit Returned",
          message: "Your security deposit has been returned",
          amount: 200,
          rentalId: "sample-rental-4",
          linkUrl: "/routes/dashboard/earnings",
        },
        read: false,
      },
      {
        type: "RENTAL_CANCELLED",
        data: {
          title: "Rental Cancelled",
          message: "A rental has been cancelled",
          propertyName: "DJI Drone",
          rentalId: "sample-rental-5",
          linkUrl: "/routes/dashboard",
        },
        read: true,
      },
    ];
    
    // Create sample notifications
    const createdNotifications = await Promise.all(
      sampleNotifications.map(notification => 
        db.notification.create({
          data: {
            userId: currentUser.id,
            type: notification.type,
            data: notification.data,
            read: notification.read,
            // Create notifications with different timestamps
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
          },
        })
      )
    );
    
    return NextResponse.json({
      message: "Sample notifications created successfully",
      count: createdNotifications.length,
      notifications: createdNotifications,
    });
  } catch (error) {
    console.error("Error creating sample notifications:", error);
    return NextResponse.json(
      { error: "Failed to create sample notifications" },
      { status: 500 }
    );
  }
} 