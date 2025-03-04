import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, status } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!["pending", "approved", "requires_input", "canceled", "reset"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // Update user verification status
    if (status === "reset") {
      // Reset all verification fields
      await db.user.update({
        where: { id: userId },
        data: {
          idVerified: false,
          idVerificationStatus: null,
          idVerificationDate: null
        }
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: {
          idVerified: status === "approved",
          idVerificationStatus: status,
          ...(status === "approved" ? { idVerificationDate: new Date() } : {})
        }
      });
    }
    
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating verification status:", error);
    return NextResponse.json(
      { error: "Failed to update verification status" },
      { status: 500 }
    );
  }
} 