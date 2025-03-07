import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

// Schema for creating a review
const createReviewSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID is required"),
  rentalId: z.string().min(1, "Rental ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000, "Review must be less than 1000 characters"),
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
    const validatedData = createReviewSchema.parse(body);
    
    // Check if the equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: validatedData.equipmentId },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Check if the rental exists and belongs to the user
    const rental = await db.rental.findUnique({
      where: {
        id: validatedData.rentalId,
        renterId: user.id,
      },
    });
    
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found or you are not authorized to review this equipment" },
        { status: 404 }
      );
    }
    
    // Check if the rental is completed
    if (rental.status !== "Completed") {
      return NextResponse.json(
        { message: "You can only review equipment after the rental is completed" },
        { status: 400 }
      );
    }
    
    // Check if the user has already reviewed this rental
    const existingReview = await db.review.findFirst({
      where: {
        equipmentId: validatedData.equipmentId,
        rentalId: validatedData.rentalId,
        authorId: user.id,
      },
    });
    
    if (existingReview) {
      return NextResponse.json(
        { message: "You have already reviewed this equipment for this rental" },
        { status: 400 }
      );
    }
    
    // Create the review
    const review = await db.review.create({
      data: {
        rating: validatedData.rating,
        content: validatedData.content,
        equipmentId: validatedData.equipmentId,
        rentalId: validatedData.rentalId,
        authorId: user.id,
      },
    });
    
    // Create a notification for the equipment owner
    await db.notification.create({
      data: {
        type: "NEW_REVIEW",
        userId: equipment.ownerId,
        data: {
          reviewId: review.id,
          equipmentId: equipment.id,
          equipmentTitle: equipment.title,
          rating: validatedData.rating,
          reviewerName: user.name,
        },
      },
    });
    
    // Update the equipment's average rating
    const allReviews = await db.review.findMany({
      where: {
        equipmentId: validatedData.equipmentId,
      },
      select: {
        rating: true,
      },
    });
    
    const averageRating = allReviews.reduce((acc, review) => acc + review.rating, 0) / allReviews.length;
    
    await db.equipment.update({
      where: {
        id: validatedData.equipmentId,
      },
      data: {
        averageRating,
      },
    });
    
    return NextResponse.json({
      message: "Review submitted successfully",
      review,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get("equipmentId");
    
    if (!equipmentId) {
      return NextResponse.json(
        { message: "Equipment ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
    });
    
    if (!equipment) {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Get reviews for the equipment
    const reviews = await db.review.findMany({
      where: {
        equipmentId,
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
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;
    
    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 