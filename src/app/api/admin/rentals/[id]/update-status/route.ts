import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating rental status
const updateRentalStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
  ]),
  notes: z.string().optional(),
});

// Use the correct Next.js App Router parameter type
type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(
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
    
    const body = await req.json();
    const { status, notes } = updateRentalStatusSchema.parse(body);
    
    // Check if rental exists
    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        renter: true,
        equipment: {
          include: {
            owner: true,
          },
        },
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    // Update rental status
    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status,
      },
    });
    
    // Create notifications for both renter and owner
    await db.notification.create({
      data: {
        userId: rental.renterId,
        type: "RENTAL_UPDATE",
        data: {
          title: "Rental Status Updated",
          message: `Your rental for ${rental.equipment.title} has been updated to ${status} by an admin.`,
          linkUrl: `/routes/rentals/${rental.id}`,
        },
      },
    });
    
    await db.notification.create({
      data: {
        userId: rental.equipment.ownerId,
        type: "RENTAL_UPDATE",
        data: {
          title: "Rental Status Updated",
          message: `The rental of your ${rental.equipment.title} has been updated to ${status} by an admin.`,
          linkUrl: `/routes/rentals/${rental.id}`,
        },
      },
    });
    
    return NextResponse.json({
      message: "Rental status updated successfully",
      rental: updatedRental,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating rental status:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 