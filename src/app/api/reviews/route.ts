import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

// Schema for creating a review
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  equipmentId: z.string(),
  rentalId: z.string().optional(),
});

// POST endpoint to create a review
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
    const validatedData = reviewSchema.parse(body);
    
    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: validatedData.equipmentId },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Check if user is not the owner
    if (equipment.ownerId === user.id) {
      return NextResponse.json(
        { message: "You cannot review your own equipment" },
        { status: 400 }
      );
    }
    
    // If rentalId is provided, check if it exists and belongs to the user
    if (validatedData.rentalId) {
      const rental = await db.rental.findUnique({
        where: { id: validatedData.rentalId },
      });
      
      if (!rental) {
        return NextResponse.json(
          { message: "Rental not found" },
          { status: 404 }
        );
      }
      
      if (rental.renterId !== user.id) {
        return NextResponse.json(
          { message: "You can only review rentals you've made" },
          { status: 400 }
        );
      }
      
      if (rental.status !== "Completed") {
        return NextResponse.json(
          { message: "You can only review completed rentals" },
          { status: 400 }
        );
      }
      
      // Check if user has already reviewed this rental
      const existingReview = await db.review.findUnique({
        where: { rentalId: validatedData.rentalId },
      });
      
      if (existingReview) {
        return NextResponse.json(
          { message: "You have already reviewed this rental" },
          { status: 400 }
        );
      }
    }
    
    // Create the review
    const review = await db.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        author: {
          connect: { id: user.id },
        },
        equipment: {
          connect: { id: validatedData.equipmentId },
        },
        receiver: {
          connect: { id: equipment.ownerId },
        },
        ...(validatedData.rentalId && {
          rental: {
            connect: { id: validatedData.rentalId },
          },
        }),
        helpfulVotes: 0,
        unhelpfulVotes: 0,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Create a notification for the equipment owner
    await db.notification.create({
      data: {
        type: "REVIEW",
        userId: equipment.ownerId,
        data: {
          message: `${user.name || "Someone"} left a review on your equipment: ${equipment.title}`,
          reviewId: review.id,
          equipmentId: equipment.id,
          rating: validatedData.rating,
          url: `/routes/equipment/${equipment.id}`
        },
        read: false,
      },
    });
    
    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating review:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reviews
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const equipmentId = url.searchParams.get("equipmentId");
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Build the where clause based on provided parameters
    const where: any = {};
    
    if (equipmentId) {
      where.equipmentId = equipmentId;
    }
    
    if (userId) {
      where.receiverId = userId;
    }
    
    // Get reviews with author details
    const reviews = await db.review.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Make sure we always return an array, even if empty
    return NextResponse.json(reviews || []);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 