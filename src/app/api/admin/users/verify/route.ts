import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for verifying a user
const verifyUserSchema = z.object({
  userId: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    
    // Validate the input
    verifyUserSchema.parse({ userId });
    
    // Update the user record to mark ID as verified
    await db.user.update({
      where: { id: userId },
      data: {
        idVerified: true,
        idVerificationStatus: "approved",
        idVerificationDate: new Date(),
      },
    });
    
    return NextResponse.redirect(new URL(`/routes/admin/users/${userId}`, req.url));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error verifying user:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 