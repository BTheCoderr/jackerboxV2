import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

// Schema for owner response
const responseSchema = z.object({
  response: z.string().min(1, "Response cannot be empty").max(1000, "Response must be less than 1000 characters"),
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
    
    const reviewId = await Promise.resolve(params.id);
    
    // Check if review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        equipment: true,
      },
    });
    
    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the equipment owner
    if (!review.equipment || review.equipment.ownerId !== user.id) {
      return NextResponse.json(
        { message: "You can only respond to reviews for your own equipment" },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = responseSchema.parse(body);
    
    // Update the review with owner response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        ownerResponse: validatedData.response,
        ownerResponseDate: new Date(),
      },
    });
    
    // Create a notification for the review author
    await db.notification.create({
      data: {
        type: "REVIEW_RESPONSE",
        userId: review.authorId,
        data: {
          message: `${user.name || "The owner"} has responded to your review`,
          reviewId: review.id,
          equipmentId: review.equipmentId,
          equipmentTitle: review.equipment?.title || "Equipment",
        },
        read: false,
      },
    });
    
    return NextResponse.json({
      success: true,
      ownerResponse: updatedReview.ownerResponse,
      ownerResponseDate: updatedReview.ownerResponseDate,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error submitting owner response:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 