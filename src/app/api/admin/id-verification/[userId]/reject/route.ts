import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { userId } = params;
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user verification status
    await db.user.update({
      where: { id: userId },
      data: {
        idVerified: false,
        idVerificationStatus: "rejected",
        idVerificationDate: new Date(),
      },
    });
    
    // Create notification for the user
    await db.notification.create({
      data: {
        type: "ID_VERIFICATION_REJECTED",
        userId: userId,
        data: {
          message: "Your ID verification has been rejected. Please try again with a clearer image or a different document.",
          rejectedBy: admin.id,
          rejectedAt: new Date(),
        },
        read: false,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "ID verification rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting verification:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 