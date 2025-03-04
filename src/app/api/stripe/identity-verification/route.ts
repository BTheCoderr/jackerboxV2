import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createIdentityVerificationSession } from "@/lib/stripe";
import { db } from "@/lib/db";

// Schema for creating a verification session
const createSessionSchema = z.object({
  returnUrl: z.string().url("Return URL must be a valid URL"),
});

// Create a verification session
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
    const { returnUrl } = createSessionSchema.parse(body);
    
    // Create a verification session with Stripe
    const verificationSession = await createIdentityVerificationSession(
      user.id,
      returnUrl
    );
    
    // Store the verification session ID in the user record
    await db.user.update({
      where: { id: user.id },
      data: {
        idVerificationStatus: "pending",
      } as any, // Use type assertion to avoid TypeScript errors
    });
    
    return NextResponse.json({
      success: true,
      clientSecret: verificationSession.client_secret,
      url: verificationSession.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Identity verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 