import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for toggling admin status
const toggleAdminSchema = z.object({
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
    toggleAdminSchema.parse({ userId });
    
    // Get the user to toggle
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Toggle admin status
    await db.user.update({
      where: { id: userId },
      data: {
        isAdmin: !user.isAdmin,
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
    
    console.error("Error toggling admin status:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 