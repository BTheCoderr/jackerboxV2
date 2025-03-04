import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for equipment updates
const updateEquipmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  condition: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  location: z.string().min(3, "Location is required").optional(),
  hourlyRate: z.number().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  tagsJson: z.string().optional(),
  imagesJson: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the equipment exists and belongs to the user
    const equipment = await db.equipment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        rentals: {
          where: {
            status: {
              in: ["Pending", "Approved"],
            },
          },
        },
      },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    if (equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to delete this equipment" },
        { status: 403 }
      );
    }
    
    // Check if there are any active rentals
    if (equipment.rentals.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete equipment with active rentals" },
        { status: 400 }
      );
    }
    
    // Delete the equipment
    await db.equipment.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json(
      { message: "Equipment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Equipment deletion error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const validatedData = updateEquipmentSchema.parse(body);
    
    // Check if the equipment exists and belongs to the user
    const equipment = await db.equipment.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    if (equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to update this equipment" },
        { status: 403 }
      );
    }
    
    // Update the equipment
    const updatedEquipment = await db.equipment.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    });
    
    return NextResponse.json(updatedEquipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Equipment update error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 