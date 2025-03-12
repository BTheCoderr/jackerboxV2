import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

// Schema for creating/updating availability
const availabilitySchema = z.object({
  startDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Start date is required"),
  endDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "End date is required"),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// GET endpoint to fetch availability for an equipment
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipmentId = params.id;
    
    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Fetch availability periods
    const availability = await db.availability.findMany({
      where: { equipmentId },
      orderBy: { startDate: "asc" },
    });
    
    // Fetch bookings for this equipment
    const bookings = await db.rental.findMany({
      where: {
        equipmentId,
        status: {
          in: ["Pending", "Approved"],
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        renter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      availability,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// POST endpoint to add new availability period
export async function POST(
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
    
    const equipmentId = params.id;
    
    // Check if equipment exists and user is the owner
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    if (equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to modify this equipment's availability" },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = availabilitySchema.parse(body);
    
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    // Check for conflicts with existing bookings
    const conflictingBookings = await db.rental.findMany({
      where: {
        equipmentId,
        status: {
          in: ["Pending", "Approved"],
        },
        OR: [
          {
            // New availability period overlaps with existing booking
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });
    
    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { message: "The selected dates conflict with existing bookings" },
        { status: 409 }
      );
    }
    
    // Check for conflicts with existing availability periods
    const conflictingAvailability = await db.availability.findMany({
      where: {
        equipmentId,
        OR: [
          {
            // New availability period overlaps with existing period
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });
    
    if (conflictingAvailability.length > 0) {
      return NextResponse.json(
        { message: "The selected dates overlap with existing availability periods" },
        { status: 409 }
      );
    }
    
    // Create new availability period
    const availability = await db.availability.create({
      data: {
        startDate,
        endDate,
        equipmentId,
      },
    });
    
    return NextResponse.json({
      message: "Availability period added successfully",
      availability,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error adding availability:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an availability period
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
    
    const { searchParams } = new URL(req.url);
    const availabilityId = searchParams.get("availabilityId");
    
    if (!availabilityId) {
      return NextResponse.json(
        { message: "Availability ID is required" },
        { status: 400 }
      );
    }
    
    // Find the availability period
    const availability = await db.availability.findUnique({
      where: { id: availabilityId },
      include: {
        equipment: {
          select: {
            ownerId: true,
          },
        },
      },
    });
    
    if (!availability) {
      return NextResponse.json(
        { message: "Availability period not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the equipment owner
    if (availability.equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to delete this availability period" },
        { status: 403 }
      );
    }
    
    // Delete the availability period
    await db.availability.delete({
      where: { id: availabilityId },
    });
    
    return NextResponse.json({
      message: "Availability period deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 