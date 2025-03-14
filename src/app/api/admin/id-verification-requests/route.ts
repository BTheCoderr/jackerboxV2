import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all users with pending verification
    const pendingUsers = await db.user.findMany({
      where: {
        idVerificationStatus: "pending",
      },
      select: {
        id: true,
        name: true,
        email: true,
        idDocumentType: true,
        idVerificationDate: true,
        notifications: {
          where: {
            type: "ID_VERIFICATION_REVIEW",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            data: true,
          },
        },
      },
    });
    
    // Format the response
    const requests = pendingUsers.map(user => {
      const notification = user.notifications[0];
      const notificationData = notification?.data as any || {};
      
      return {
        id: notification?.id || user.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        documentType: user.idDocumentType || "unknown",
        submittedAt: user.idVerificationDate || notification?.createdAt || new Date(),
        confidence: notificationData.confidence || 0,
      };
    });
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 