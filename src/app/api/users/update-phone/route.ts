import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { validatePhoneNumber } from "@/lib/firebase-auth";

// Schema for phone update request
const phoneUpdateSchema = z.object({
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
    const { phone } = phoneUpdateSchema.parse(body);
    
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
    
    // Update user's phone number
    await db.user.update({
      where: { id: user.id },
      data: {
        phone,
        phoneVerified: false, // Reset verification status when phone is updated
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Phone update error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 