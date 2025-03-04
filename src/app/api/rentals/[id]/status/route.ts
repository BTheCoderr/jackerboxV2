import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Define the status update schema
const statusUpdateSchema = z.object({
  status: z.enum(["Pending", "Approved", "Completed", "Cancelled", "Rejected"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    const validatedData = statusUpdateSchema.parse(body);
    
    // Check if the rental exists
    const rental = await db.rental.findUnique({
      where: {
        id: params.id,
      },
      include: {
        equipment: true,
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the renter or the owner
    const isRenter = rental.renterId === user.id;
    const isOwner = rental.equipment.ownerId === user.id;
    
    if (!isRenter && !isOwner) {
      return NextResponse.json(
        { message: "You are not authorized to update this rental" },
        { status: 403 }
      );
    }
    
    // Validate status transitions
    const currentStatus = rental.status;
    const newStatus = validatedData.status;
    
    // Owner-only status changes
    if (newStatus === "Approved" && !isOwner) {
      return NextResponse.json(
        { message: "Only the owner can approve a rental" },
        { status: 403 }
      );
    }
    
    if (newStatus === "Rejected" && !isOwner) {
      return NextResponse.json(
        { message: "Only the owner can reject a rental" },
        { status: 403 }
      );
    }
    
    // Invalid transitions
    if (currentStatus === "Completed" || currentStatus === "Cancelled") {
      return NextResponse.json(
        { message: `Cannot change status from ${currentStatus}` },
        { status: 400 }
      );
    }
    
    if (currentStatus === "Rejected" && newStatus !== "Cancelled") {
      return NextResponse.json(
        { message: "Rejected rentals can only be cancelled" },
        { status: 400 }
      );
    }
    
    // Update the rental status
    const updatedRental = await db.rental.update({
      where: {
        id: params.id,
      },
      data: {
        status: newStatus,
      },
    });
    
    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error("Error updating rental status:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to update rental status" },
      { status: 500 }
    );
  }
} 