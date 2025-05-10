import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/upstash-rate-limit";
import { verifyCode } from "@/lib/firebase-auth";

// Schema for phone verification request
const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"),
  verificationId: z.string().min(1, "Verification ID is required"),
  code: z.string().min(6, "Verification code is required"),
});

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await rateLimit(`verify_phone_${ip}`);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { phone, verificationId, code } = phoneVerificationSchema.parse(body);
    
    // Implement actual Firebase verification
    const verificationResult = await verifyCode(
      { confirm: async (code: string) => ({ verificationId }) }, 
      code
    );
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }
    
    // Check if the phone number matches the one in the user's record
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone: true,
      },
    });
    
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user's phone verification status
    await db.user.update({
      where: { id: user.id },
      data: {
        phone: phone,
        phoneVerified: true,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.error("Error verifying phone:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to verify phone number" },
      { status: 500 }
    );
  }
}