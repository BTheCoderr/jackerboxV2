import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { ModerationStatus } from "../../../../../../../prisma/generated/client";

// Schema for moderating equipment
const moderateEquipmentSchema = z.object({
  moderationStatus: z.enum([
    ModerationStatus.PENDING,
    ModerationStatus.APPROVED,
    ModerationStatus.REJECTED,
    ModerationStatus.FLAGGED,
  ]),
  moderationNotes: z.string().optional(),
});

// Use the correct Next.js App Router parameter type
type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(
  req: Request,
  context: RouteParams
) {
  try {
    const user = await getCurrentUser();
    const { id } = context.params;
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { moderationStatus, moderationNotes } = moderateEquipmentSchema.parse(body);
    
    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Update equipment moderation status
    await db.equipment.update({
      where: { id },
      data: {
        moderationStatus,
        moderationNotes,
        moderatedAt: new Date(),
        moderatedBy: user.id,
      },
    });
    
    return NextResponse.json({
      message: "Equipment moderation status updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error moderating equipment:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 