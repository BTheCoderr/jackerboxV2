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
    
    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Check if equipment has active rentals
    const activeRentals = await db.rental.count({
      where: {
        equipmentId: id,
        status: {
          in: ["PENDING", "CONFIRMED", "ACTIVE"],
        },
      },
    });
    
    if (activeRentals > 0) {
      return NextResponse.json(
        { message: "Cannot delete equipment with active rentals" },
        { status: 400 }
      );
    }
    
    // Delete equipment
    await db.equipment.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 