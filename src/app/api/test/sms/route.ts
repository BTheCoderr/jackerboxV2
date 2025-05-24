import { NextResponse } from "next/server";
import { z } from "zod";
import { 
  generateVerificationCode, 
  sendVerificationSMS, 
  validatePhoneNumber 
} from "@/lib/phone-verification";

// Schema for test SMS request
const testSmsSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number is required"),
  message: z.string().optional(),
});

// Test SMS endpoint - bypasses user account requirements
export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Test endpoint not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { phoneNumber, message } = testSmsSchema.parse(body);
    
    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Use custom message or default verification message
    const smsMessage = message || `Your Jackerbox test verification code is: ${verificationCode}. This is a test SMS via email-to-SMS gateway!`;
    
    console.log(`🧪 TEST SMS: Sending to ${phoneNumber}`);
    console.log(`📱 Message: ${smsMessage}`);
    
    // Send SMS with verification code
    const smsSent = await sendVerificationSMS(phoneNumber, verificationCode);
    
    if (!smsSent) {
      return NextResponse.json(
        { 
          error: "Failed to send test SMS", 
          phoneNumber,
          code: verificationCode,
          message: smsMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Test SMS sent successfully!",
      phoneNumber,
      code: verificationCode,
      testMode: true,
      smsMessage
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Test SMS error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET handler to show endpoint info
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Test endpoint not available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "SMS Test Endpoint",
    description: "Test free SMS functionality without user account requirements",
    usage: {
      method: "POST",
      body: {
        phoneNumber: "+1234567890",
        message: "Optional custom message"
      }
    },
    example: `curl -X POST http://localhost:3001/api/test/sms -H "Content-Type: application/json" -d '{"phoneNumber": "+14012179799"}'`
  });
} 