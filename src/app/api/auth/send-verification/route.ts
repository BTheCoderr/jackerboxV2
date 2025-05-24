import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { 
  generateVerificationCode, 
  sendVerificationSMS, 
  validatePhoneNumber 
} from "@/lib/phone-verification";
import { 
  isTestMode, 
  isTestPhoneNumber, 
  TEST_VERIFICATION_CODE
} from "@/lib/test-utils";

// Schema for phone verification request
const phoneVerificationSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number is required"),
});

// Send verification code for login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber } = phoneVerificationSchema.parse(body);
    
    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    // For test phone numbers in development, automatically "succeed" without checking for existing user
    if (isTestMode() && isTestPhoneNumber(phoneNumber)) {
      console.log(`TEST MODE: Verification code for ${phoneNumber} is ${TEST_VERIFICATION_CODE}`);
      return NextResponse.json({
        success: true,
        message: "Test verification code sent",
        testMode: true,
        testCode: TEST_VERIFICATION_CODE
      });
    }
    
    // Check if user exists with this phone number (only for real phone numbers)
    const existingUser = await db.user.findFirst({
      where: {
        phone: phoneNumber,
      },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "No account found with this phone number" },
        { status: 404 }
      );
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code in database
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        verificationToken: verificationCode,
      },
    });
    
    // Send SMS with verification code for real phone numbers
    const smsSent = await sendVerificationSMS(phoneNumber, verificationCode);
    
    if (!smsSent) {
      return NextResponse.json(
        { error: "Failed to send verification SMS. Please try again." },
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
        { error: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 