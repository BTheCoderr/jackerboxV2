import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Schema for phone verification request
const phoneVerificationSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { phone } = phoneVerificationSchema.parse(body);
    
    // Check if the phone number matches the one in the user's record
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone: true,
      },
    });
    
    if (!currentUser || currentUser.phone !== phone) {
      return NextResponse.json(
        { message: "Phone number does not match the one on record" },
        { status: 400 }
      );
    }
    
    // Update user's phone verification status
    await db.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 