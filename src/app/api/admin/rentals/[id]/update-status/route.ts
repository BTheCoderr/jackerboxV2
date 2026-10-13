import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating rental status
const updateRentalStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
});

// Use the correct Next.js App Router parameter type
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  req: Request,
  context: RouteParams
) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { status } = updateRentalStatusSchema.parse(body);
    
    // Check if rental exists
    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        payment: true,
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
    
    const paymentOk = rental.payment?.status === "COMPLETED";
    const allowed =
      (status === "ACTIVE" && rental.status === "PAID" && paymentOk) ||
      (status === "COMPLETED" && rental.status === "ACTIVE" && paymentOk) ||
      (status === "CANCELLED" && rental.status === "PENDING" && !rental.payment?.stripePaymentIntentId);

    if (!allowed) return NextResponse.json(
      { message: "Invalid transition or unresolved payment. Paid cancellations need refund processing." },
      { status: 409 }
    );

    const changed = await db.rental.updateMany({
      where: { id, status: rental.status },
      data: { status },
    });
    if (changed.count !== 1) return NextResponse.json(
      { message: "The rental changed during this request. Refresh and retry." },
      { status: 409 }
    );
    const updatedRental = await db.rental.findUnique({ where: { id } });

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