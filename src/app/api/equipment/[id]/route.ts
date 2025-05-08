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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipment = await db.equipment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!equipment) {
      return new NextResponse('Equipment not found', { status: 404 });
    }

    // Get current user's location if available
    const currentUser = await getCurrentUser();
    let distance = null;
    
    if (currentUser?.latitude && currentUser?.longitude && equipment.latitude && equipment.longitude) {
      // Calculate distance using Haversine formula
      const R = 3963.19; // Earth's radius in miles
      const lat1 = currentUser.latitude * Math.PI / 180;
      const lat2 = equipment.latitude * Math.PI / 180;
      const dLat = lat2 - lat1;
      const dLon = (equipment.longitude - currentUser.longitude) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;
    }

    return NextResponse.json({
      ...equipment,
      distance,
    });
  } catch (error) {
    console.error('[EQUIPMENT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

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
    
    // Properly await params before using
    const equipmentId = await Promise.resolve(params.id);
    
    // Check if user is a renter (has rental history)
    const userRentals = await db.rental.count({
      where: {
        renterId: user.id
      }
    });
    
    if (userRentals > 0) {
      return NextResponse.json(
        { message: "Renters cannot manage equipment. Please use a separate owner account." },
        { status: 403 }
      );
    }
    
    // Check if the equipment exists and belongs to the user
    const equipment = await db.equipment.findUnique({
      where: {
        id: equipmentId,
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
        id: equipmentId,
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
    
    // Properly await params before using
    const equipmentId = await Promise.resolve(params.id);
    
    // Check if user is a renter (has rental history)
    const userRentals = await db.rental.count({
      where: {
        renterId: user.id
      }
    });
    
    if (userRentals > 0) {
      return NextResponse.json(
        { message: "Renters cannot manage equipment. Please use a separate owner account." },
        { status: 403 }
      );
    }
    
    // Check if the equipment exists and belongs to the user
    const equipment = await db.equipment.findUnique({
      where: {
        id: equipmentId,
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
    
    const body = await req.json();
    const validatedData = updateEquipmentSchema.parse(body);
    
    // Update the equipment
    const updatedEquipment = await db.equipment.update({
      where: {
        id: equipmentId,
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