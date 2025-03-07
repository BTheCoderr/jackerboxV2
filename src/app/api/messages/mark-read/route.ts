import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

// Schema for marking messages as read
const markReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, "At least one message ID is required"),
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
    
    const body = await req.json();
    const validatedData = markReadSchema.parse(body);
    
    // Verify that the user is the receiver of all messages
    const messages = await db.message.findMany({
      where: {
        id: {
          in: validatedData.messageIds,
        },
      },
    });
    
    // Check if all messages exist
    if (messages.length !== validatedData.messageIds.length) {
      return NextResponse.json(
        { message: "One or more messages not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the receiver of all messages
    const isReceiverOfAll = messages.every((message) => message.receiverId === user.id);
    
    if (!isReceiverOfAll) {
      return NextResponse.json(
        { message: "You are not authorized to mark these messages as read" },
        { status: 403 }
      );
    }
    
    // Mark messages as read
    await db.message.updateMany({
      where: {
        id: {
          in: validatedData.messageIds,
        },
        receiverId: user.id,
      },
      data: {
        isRead: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 