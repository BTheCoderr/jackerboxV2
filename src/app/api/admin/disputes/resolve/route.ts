import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for dispute resolution
const disputeResolutionSchema = z.object({
  rentalId: z.string().min(1, "Rental ID is required"),
  resolution: z.string().min(1, "Resolution explanation is required"),
  outcome: z.enum(["FAVOR_RENTER", "FAVOR_OWNER", "COMPROMISE"]),
  refundAmount: z.number().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    // Ensure user is an admin
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = disputeResolutionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { rentalId, resolution, outcome, refundAmount } = validationResult.data;
    
    // Find the rental
    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: {
        equipment: {
          include: {
            owner: true,
          },
        },
        renter: true,
        payment: true,
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    if (rental.status !== "DISPUTED") {
      return NextResponse.json(
        { message: "Rental is not in a disputed state" },
        { status: 400 }
      );
    }
    
    // Find open dispute for this rental
    const openDispute = await db.dispute.findFirst({
      where: {
        rentalId,
        status: "OPEN",
      },
    });
    
    if (!openDispute) {
      return NextResponse.json(
        { message: "No open dispute found for this rental" },
        { status: 404 }
      );
    }
    
    // Start a transaction to ensure all updates happen together
    const result = await db.$transaction(async (tx) => {
      // 1. Update the dispute status
      await tx.dispute.update({
        where: { id: openDispute.id },
        data: {
          status: "RESOLVED",
          resolution,
          outcome,
          resolvedById: user.id,
          resolvedAt: new Date(),
        },
      });
      
      // 2. Update rental status based on outcome
      await tx.rental.update({
        where: { id: rentalId },
        data: {
          status: outcome === "FAVOR_OWNER" ? "COMPLETED" : "CANCELLED",
          updatedAt: new Date(),
        },
      });
      
      // 3. Process refund if needed
      if ((outcome === "FAVOR_RENTER" || outcome === "COMPROMISE") && refundAmount && refundAmount > 0) {
        // Check if payment exists and has a valid amount
        if (!rental.payment) {
          throw new Error("No payment found for this rental");
        }
        
        // Record the refund transaction
        await tx.transaction.create({
          data: {
            amount: refundAmount,
            type: "REFUND",
            status: "COMPLETED",
            description: `Refund for disputed rental #${rentalId.substring(0, 8)}`,
            userId: rental.renterId,
            rentalId,
          },
        });
      }
      
      // 4. Create notifications for both parties
      // For the renter
      await tx.notification.create({
        data: {
          type: "DISPUTE_RESOLVED",
          userId: rental.renterId,
          data: {
            rentalId,
            equipmentName: rental.equipment.title,
            resolution,
            outcome,
            refundAmount: refundAmount || 0,
          },
        },
      });
      
      // For the owner
      await tx.notification.create({
        data: {
          type: "DISPUTE_RESOLVED",
          userId: rental.equipment.ownerId,
          data: {
            rentalId,
            equipmentName: rental.equipment.title,
            resolution,
            outcome,
            refundAmount: refundAmount || 0,
          },
        },
      });
      
      return { success: true };
    });
    
    return NextResponse.json({
      message: "Dispute resolved successfully",
      outcome,
    });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 