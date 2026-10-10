import { NextResponse } from "next/server";
import { generateICalFeed } from "@/lib/calendar-sync/calendar-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const equipmentId = (await params).id;
    
    // Generate iCal feed
    const icalContent = await generateICalFeed(equipmentId);
    
    // Return as text/calendar
    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="jackerbox-equipment-${equipmentId}.ics"`,
      },
    });
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 