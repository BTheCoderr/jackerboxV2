import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

const createRentalSchema = z.object({
  equipmentId: z.string(),
  startDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "Start date must be today or later"),
  endDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "End date is required"),
  rentalType: z.enum(["hourly", "daily", "weekly"]),
  totalPrice: z.number().min(0),
  securityDeposit: z.number().min(0).optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is an owner-only
    if (user.userType === "owner") {
      return NextResponse.json(
        { message: "Equipment owners cannot rent items. Please create a separate renter account." },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const validatedData = createRentalSchema.parse(body);
    
    // Check if the equipment exists and is available
    const equipment = await db.equipment.findUnique({
      where: {
        id: validatedData.equipmentId,
        isAvailable: true,
      },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found or not available" },
        { status: 404 }
      );
    }
    
    // Check if the user is not trying to rent their own equipment
    if (equipment.ownerId === user.id) {
      return NextResponse.json(
        { message: "You cannot rent your own equipment" },
        { status: 400 }
      );
    }
    
    // If this is the first rental, update the user type to renter or both
    const userRentals = await db.rental.count({
      where: {
        renterId: user.id
      }
    });
    
    if (userRentals === 0 && user.userType !== "renter") {
      // Update user type to "both" if it was previously undefined or "owner"
      await db.user.update({
        where: { id: user.id },
        data: { userType: "both" }
      });
    }
    
    // Check for date conflicts with existing rentals
    const conflictingRentals = await db.rental.findMany({
      where: {
        equipmentId: validatedData.equipmentId,
        status: {
          in: ["Pending", "Approved"],
        },
        OR: [
          {
            // New rental starts during an existing rental
            startDate: {
              lte: new Date(validatedData.endDate),
            },
            endDate: {
              gte: new Date(validatedData.startDate),
            },
          },
        ],
      },
    });
    
    if (conflictingRentals.length > 0) {
      return NextResponse.json(
        { message: "Equipment is not available for the selected dates" },
        { status: 409 }
      );
    }
    
    // Create the rental
    const rental = await db.rental.create({
      data: {
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        totalPrice: validatedData.totalPrice,
        securityDeposit: validatedData.securityDeposit,
        status: "Pending",
        equipmentId: validatedData.equipmentId,
        renterId: user.id,
      },
    });
    
    return NextResponse.json(
      { rental, message: "Rental created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Rental creation error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // "renter" or "owner"
    
    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type === "renter") {
      whereClause.renterId = user.id;
    } else if (type === "owner") {
      whereClause.equipment = {
        ownerId: user.id,
      };
    } else {
      // Default to showing rentals where the user is the renter
      whereClause.renterId = user.id;
    }
    
    const rentals = await db.rental.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        equipment: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        payment: true,
      },
    });
    
    return NextResponse.json({ rentals });
  } catch (error) {
    console.error("Rentals fetch error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 