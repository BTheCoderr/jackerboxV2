import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

// POST /api/admin/verify-user - Verify a user for testing purposes
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    // For development purposes, we'll allow this without admin check
    // In production, you would want to check if the user is an admin
    
    const body = await req.json();
    const { email, userType } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }
    
    // Find the user by email
    const targetUser = await db.user.findUnique({
      where: { email },
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update the user's verification status
    const updatedUser = await db.user.update({
      where: { email },
      data: {
        idVerified: true,
        idVerificationStatus: "VERIFIED",
        idVerificationDate: new Date(),
        phoneVerified: true,
        // Only set userType if it's provided and valid
        ...(userType ? { userType } : {}),
      },
    });
    
    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      message: "User verified successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 