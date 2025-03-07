import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { saveCalendarSyncSettings } from "@/lib/calendar-sync/calendar-service";

// Schema for calendar sync settings
const calendarSyncSchema = z.object({
  userId: z.string(),
  equipmentId: z.string(),
  calendarType: z.enum(["google", "ical"]),
  calendarId: z.string().optional(),
  icalUrl: z.string().url().optional(),
  syncDirection: z.enum(["import", "export", "both"]),
  syncFrequency: z.enum(["hourly", "daily", "manual"]),
});

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
        { message: "You are not authorized to modify this equipment's calendar settings" },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = calendarSyncSchema.parse(body);
    
    // Save calendar sync settings
    const result = await saveCalendarSyncSettings(validatedData);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: "Calendar sync settings saved successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error saving calendar sync settings:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 