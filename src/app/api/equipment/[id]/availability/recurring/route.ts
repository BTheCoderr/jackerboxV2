import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

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
    const validatedData = recurringAvailabilitySchema.parse({
      ...body,
      dates: body.dates.map((date: any) => ({
        startDate: new Date(date.startDate),
        endDate: new Date(date.endDate),
      })),
    });
    
    // Check for conflicts with existing bookings for each date
    const allDates = validatedData.dates;
    const conflictingDates = [];
    
    for (const date of allDates) {
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
        conflictingDates.push(date);
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
        conflictingDates.push(date);
      }
    }
    
    if (conflictingDates.length > 0) {
      return NextResponse.json(
        { 
          message: "Some dates conflict with existing bookings or availability periods",
          conflictingDates 
        },
        { status: 409 }
      );
    }
    
    // Create all availability periods
    const availabilities = await Promise.all(
      allDates.map(async (date) => {
        return db.availability.create({
          data: {
            startDate: date.startDate,
            endDate: date.endDate,
            equipmentId,
            isRecurring: true,
            recurrenceType: validatedData.recurrenceType,
            recurrenceInterval: validatedData.recurrenceInterval,
            recurrenceEndDate: new Date(validatedData.recurrenceEndDate),
            recurrenceDaysOfWeek: validatedData.recurrenceDaysOfWeek,
          },
        });
      })
    );
    
    return NextResponse.json({
      message: "Recurring availability periods added successfully",
      availabilities,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error adding recurring availability:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 