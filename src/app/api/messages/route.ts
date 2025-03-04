import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Define the message schema
const messageSchema = z.object({
  rentalId: z.string(),
  content: z.string().min(1, "Message cannot be empty"),
});

export async function POST(req: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    const validatedData = messageSchema.parse(body);
    
    // Check if the rental exists and the user is involved
    const rental = await db.rental.findUnique({
      where: {
        id: validatedData.rentalId,
      },
      include: {
        equipment: true,
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the renter or the owner
    if (rental.renterId !== user.id && rental.equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to send messages for this rental" },
        { status: 403 }
      );
    }
    
    // Create the message
    const message = await db.message.create({
      data: {
        content: validatedData.content,
        senderId: user.id,
        rentalId: validatedData.rentalId,
      },
    });
    
    // Update the rental's updatedAt timestamp
    await db.rental.update({
      where: {
        id: validatedData.rentalId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the rental ID from the query parameters
    const url = new URL(req.url);
    const rentalId = url.searchParams.get("rentalId");
    
    if (!rentalId) {
      return NextResponse.json(
        { message: "Rental ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the rental exists and the user is involved
    const rental = await db.rental.findUnique({
      where: {
        id: rentalId,
      },
      include: {
        equipment: true,
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the renter or the owner
    if (rental.renterId !== user.id && rental.equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You are not authorized to view messages for this rental" },
        { status: 403 }
      );
    }
    
    // Get the messages for the rental
    const messages = await db.message.findMany({
      where: {
        rentalId,
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
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    
    return NextResponse.json(
      { message: "Failed to get messages" },
      { status: 500 }
    );
  }
} 