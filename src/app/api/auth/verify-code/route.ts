import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validatePhoneNumber } from "@/lib/phone-verification";
import { 
  isTestMode, 
  isTestPhoneNumber, 
  isTestVerificationCode,
  TEST_VERIFICATION_CODE
} from "@/lib/test-utils";

// Schema for phone verification code check
const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Verify the SMS code for login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, code } = verifyCodeSchema.parse(body);
    
    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    // Special handling for test phone numbers - bypass user lookup
    if (isTestMode() && isTestPhoneNumber(phoneNumber) && isTestVerificationCode(code)) {
      return NextResponse.json({
        success: true,
        message: "Test phone number verified successfully",
        testMode: true,
        user: {
          id: "test-user-id",
          phone: phoneNumber,
          name: "Test User",
          email: `test_${phoneNumber.replace(/\D/g, '')}@jackerbox.com`
        }
      });
    }
    
    // Get user with verification token (for real phone numbers)
    const user = await db.user.findFirst({
      where: { 
        phone: phoneNumber,
        verificationToken: code 
      },
      select: {
        id: true,
        verificationToken: true,
        phone: true,
        name: true,
        email: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification code or phone number" },
        { status: 400 }
      );
    }
    
    // Clear the verification token after successful verification
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
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