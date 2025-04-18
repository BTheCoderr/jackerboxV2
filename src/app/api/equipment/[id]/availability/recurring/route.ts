import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { PaperclipIcon } from 'lucide-react';

// Define a type for date ranges
interface DateRange {
  startDate: Date;
  endDate: Date;
}


// Define a type for date ranges
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Schema for creating recurring availability
const recurringAvailabilitySchema = z.object({
  dates: z.array(z.object({
    startDate: z.date(),
    endDate: z.date(),
  })),
  recurrenceType: z.enum(["daily", "weekly", "monthly"]),
  recurrenceInterval: z.number().min(1),
  recurrenceEndDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "End date is required"),
  recurrenceDaysOfWeek: z.string().nullable(),
});

// POST endpoint to add recurring availability periods
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
    
    const equipmentId = await Promise.resolve(params.id);
    
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
        { message: "You are not authorized to update this equipment" },
        { status: 403 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = recurringAvailabilitySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { dates, recurrenceType, recurrenceInterval, recurrenceEndDate, recurrenceDaysOfWeek } = validationResult.data;
    
    // Check for conflicts with existing bookings and availability periods
    const conflictingDates: DateRange[] = [];
    
    for (const date of dates) {
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
                lte: date.endDate,
              },
              endDate: {
                gte: date.startDate,
              },
            },
          ],
        },
      });
      if (conflictingBookings.length > 0) {
        conflictingDates.push({
          startDate: date.startDate,
          endDate: date.endDate
        });
      }
      
      // Check for conflicts with existing availability periods  
      const conflictingAvailability = await db.availability.findMany({
        where: {
          equipmentId,
          OR: [
            {
              // New availability period overlaps with existing period
              startDate: {
                lte: date.endDate,
              },
              endDate: {
                gte: date.startDate,
              },
            },
          ],
        },
      });
      if (conflictingAvailability.length > 0) {
        conflictingDates.push({
          startDate: date.startDate,
          endDate: date.endDate
        });
      }
    }
    
    if (conflictingDates.length > 0) {
      return NextResponse.json(
        { 
          message: "Some dates conflict with existing bookings or availability periods",
          conflictingDates,
        },
        { status: 409 }
      );
    }
    
    // Create availability periods for all dates
    const availabilities: any[] = [];
    
    for (const date of dates) {
      const availability = await db.availability.create({
        data: {
          equipmentId,
          startDate: date.startDate,
          endDate: date.endDate,
          recurrenceType,
          recurrenceInterval,
          recurrenceEndDate: new Date(recurrenceEndDate),
          recurrenceDaysOfWeek,
        },
      });
      
      availabilities.push(availability);
    }
    
    return NextResponse.json({
      message: "Recurring availability periods created successfully",
      availabilities,
    });
  } catch (error) {
    console.error("Error creating recurring availability:", error);
    return NextResponse.json(
      { message: "Failed to create recurring availability" },
      { status: 500 }
    );
  }
} 