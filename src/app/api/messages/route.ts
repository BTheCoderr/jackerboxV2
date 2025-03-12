import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// Schema for creating a message
const messageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  receiverId: z.string().min(1, "Receiver ID is required"),
  equipmentId: z.string().optional(),
  attachments: z.array(
    z.object({
      type: z.string(),
      url: z.string().url(),
      name: z.string(),
      size: z.number().optional(),
    })
  ).optional(),
});

// POST endpoint to create a new message
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = messageSchema.parse(body);
    
    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: validatedData.receiverId },
    });
    
    if (!receiver) {
      return NextResponse.json(
        { message: "Receiver not found" },
        { status: 404 }
      );
    }
    
    // Create the message
    const message = await db.message.create({
      data: {
        content: validatedData.content,
        senderId: user.id,
        receiverId: validatedData.receiverId,
        attachmentsJson: validatedData.attachments ? JSON.stringify(validatedData.attachments) : "[]",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Create a notification for the receiver
    await db.notification.create({
      data: {
        type: "NEW_MESSAGE",
        userId: validatedData.receiverId,
        data: {
          messageId: message.id,
          senderId: user.id,
          senderName: user.name,
          content: validatedData.content.substring(0, 50) + (validatedData.content.length > 50 ? "..." : ""),
          equipmentId: validatedData.equipmentId,
          hasAttachments: validatedData.attachments && validatedData.attachments.length > 0,
        },
      },
    });
    
    // Parse attachments from JSON
    const attachments = message.attachmentsJson ? JSON.parse(message.attachmentsJson) : [];
    
    // Return the message with parsed attachments
    return NextResponse.json({
      message: {
        ...message,
        attachments,
        attachmentsJson: undefined, // Remove the JSON string from the response
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating message:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch messages
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const otherUserId = url.searchParams.get("otherUserId");
    
    if (!otherUserId) {
      return NextResponse.json(
        { message: "Other user ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch messages between the current user and the other user
    const messages = await db.message.findMany({
      where: {
        OR: [
          {
            senderId: user.id,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: user.id,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Parse attachments from JSON for each message
    const messagesWithAttachments = messages.map(message => {
      const attachments = message.attachmentsJson ? JSON.parse(message.attachmentsJson) : [];
      
      return {
        ...message,
        attachments,
        attachmentsJson: undefined, // Remove the JSON string from the response
      };
    });
    
    return NextResponse.json({
      messages: messagesWithAttachments,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 