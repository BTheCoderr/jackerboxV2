import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

// Define the schema for review submission
const reviewSchema = z.object({
  rentalId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export async function POST(req: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = reviewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { rentalId, rating, comment } = validationResult.data;

    // Find the rental
    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: {
        equipment: true,
        review: true,
      },
    });

    // Check if rental exists
    if (!rental) {
      return NextResponse.json(
        { message: "Rental not found" },
        { status: 404 }
      );
    }

    // Check if user is the renter
    if (rental.renterId !== user.id) {
      return NextResponse.json(
        { message: "Only the renter can leave a review" },
        { status: 403 }
      );
    }

    // Check if rental is completed
    if (rental.status !== "Completed") {
      return NextResponse.json(
        { message: "Can only review completed rentals" },
        { status: 400 }
      );
    }

    // Check if review already exists
    if (rental.review) {
      return NextResponse.json(
        { message: "Review already exists for this rental" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await db.review.create({
      data: {
        rating,
        comment,
        authorId: user.id,
        equipmentId: rental.equipmentId,
        rentalId: rentalId,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 