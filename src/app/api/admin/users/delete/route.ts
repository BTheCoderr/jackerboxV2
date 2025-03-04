import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for deleting a user
const deleteUserSchema = z.object({
  userId: z.string(),
});

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    
    // Validate the input
    deleteUserSchema.parse({ userId });
    
    // Prevent deleting yourself
    if (userId === currentUser.id) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete the user
    await db.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.redirect(new URL("/routes/admin/users", req.url));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 