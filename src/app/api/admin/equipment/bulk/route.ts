import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { ModerationStatus } from "../../../../../../prisma/generated/client";
import { z } from "zod";

const bulkActionSchema = z.object({
  action: z.enum(["approve", "reject", "flag", "delete", "export"]),
  equipmentIds: z.array(z.string()),
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
    
    const body = await req.json();
    const { action, equipmentIds } = bulkActionSchema.parse(body);
    
    switch (action) {
      case "approve":
      case "reject":
      case "flag":
        // Update moderation status
        await db.equipment.updateMany({
          where: {
            id: {
              in: equipmentIds,
            },
          },
          data: {
            moderationStatus: action === "approve" 
              ? ModerationStatus.APPROVED 
              : action === "reject"
              ? ModerationStatus.REJECTED
              : ModerationStatus.FLAGGED,
            moderatedAt: new Date(),
            moderatedBy: user.id,
          },
        });
        break;
        
      case "delete":
        // Check for active rentals before deletion
        const equipmentWithRentals = await db.equipment.findMany({
          where: {
            id: {
              in: equipmentIds,
            },
            rentals: {
              some: {
                status: {
                  in: ["PENDING", "APPROVED"],
                },
              },
            },
          },
          select: {
            id: true,
          },
        });
        
        const equipmentIdsWithRentals = equipmentWithRentals.map((e) => e.id);
        const equipmentIdsToDelete = equipmentIds.filter(
          (id) => !equipmentIdsWithRentals.includes(id)
        );
        
        if (equipmentIdsToDelete.length > 0) {
          await db.equipment.deleteMany({
            where: {
              id: {
                in: equipmentIdsToDelete,
              },
            },
          });
        }
        
        if (equipmentIdsWithRentals.length > 0) {
          return NextResponse.json(
            {
              message: `${equipmentIdsWithRentals.length} items could not be deleted due to active rentals`,
              deletedCount: equipmentIdsToDelete.length,
            },
            { status: 200 }
          );
        }
        break;
        
      case "export":
        // Fetch equipment data for export
        const equipmentData = await db.equipment.findMany({
          where: {
            id: {
              in: equipmentIds,
            },
          },
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
            rentals: {
              select: {
                status: true,
                startDate: true,
                endDate: true,
                totalPrice: true,
              },
            },
          },
        });
        
        // Transform data for CSV export
        const csvData = equipmentData.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          condition: item.condition,
          owner: item.owner.name || item.owner.email,
          status: item.isAvailable ? "Available" : "Unavailable",
          moderationStatus: item.moderationStatus,
          totalRentals: item.rentals.length,
          totalRevenue: item.rentals
            .filter((r) => r.status === "COMPLETED")
            .reduce((acc, r) => acc + r.totalPrice, 0),
          createdAt: item.createdAt.toISOString(),
        }));
        
        return NextResponse.json({ data: csvData });
    }
    
    return NextResponse.json({
      message: `Successfully performed ${action} on ${equipmentIds.length} items`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 