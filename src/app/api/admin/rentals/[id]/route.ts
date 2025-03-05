import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

// Use the correct Next.js App Router parameter type
type RouteParams = {
  params: {
    id: string;
  };
};

export async function DELETE(
  req: Request,
  context: RouteParams
) {
  try {
    const user = await getCurrentUser();
    const { id } = context.params;
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if rental exists
    const rental = await db.rental.findUnique({
      where: { id },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    // Delete rental
    await db.rental.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: "Rental deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rental:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 