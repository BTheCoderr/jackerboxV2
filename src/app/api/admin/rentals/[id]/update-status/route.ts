import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Define schema for updating rental status
const updateRentalStatusSchema = z.object({
  status: z.enum([
    "PENDING", 
    "CONFIRMED", 
    "IN_PROGRESS", 
    "COMPLETED", 
    "CANCELLED", 
    "DISPUTED"
  ]),
  adminNote: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get and validate request body
    const body = await req.json();
    const validationResult = updateRentalStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status, adminNote } = validationResult.data;

    // Check if rental exists
    const rental = await db.rental.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    // Update rental status
    const updatedRental = await db.rental.update({
      where: {
        id: params.id,
      },
      data: {
        status,
        // Add admin note if provided
        ...(adminNote && {
          adminNotes: adminNote,
        }),
      },
    });

    // Log the status change (to console for now)
    console.log(`Rental ${rental.id} status updated from ${rental.status} to ${status} by admin ${user.id}`);

    return NextResponse.json({
      message: "Rental status updated successfully",
      rental: updatedRental,
    });
  } catch (error) {
    console.error("Error updating rental status:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the rental status" },
      { status: 500 }
    );
  }
} 