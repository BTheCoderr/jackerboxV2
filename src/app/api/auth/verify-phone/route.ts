import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { 
  generateVerificationCode, 
  sendVerificationSMS, 
  validatePhoneNumber 
} from "@/lib/phone-verification";

// Schema for phone verification request
const phoneVerificationSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
});

// Schema for phone verification code check
const verifyCodeSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Send verification code
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
    
    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    // Check if phone is already used by another user
    const existingUser = await db.user.findFirst({
      where: {
        phone,
        id: { not: user.id },
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "This phone number is already associated with another account" },
        { status: 400 }
      );
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code in database
    await db.user.update({
      where: { id: user.id },
      data: {
        phone,
        verificationToken: verificationCode,
      },
    });
    
    // Send SMS with verification code
    const smsSent = await sendVerificationSMS(phone, verificationCode);
    
    if (!smsSent) {
      return NextResponse.json(
        { message: "Failed to send verification SMS. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
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

// Verify the code
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { phone, code } = verifyCodeSchema.parse(body);
    
    // Get user with verification token
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        verificationToken: true,
        phone: true,
      },
    });
    
    if (!currentUser || currentUser.verificationToken !== code) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }
    
    if (currentUser.phone !== phone) {
      return NextResponse.json(
        { message: "Phone number does not match the one being verified" },
        { status: 400 }
      );
    }
    
    // Update user record to mark phone as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        verificationToken: null, // Clear the token after successful verification
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