import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

// Schema for voting
const voteSchema = z.object({
  isHelpful: z.boolean(),
});

// POST endpoint to vote on a review
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
    });
    
    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }
    
    // Prevent voting on own reviews
    if (review.authorId === user.id) {
      return NextResponse.json(
        { message: "You cannot vote on your own review" },
        { status: 400 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = voteSchema.parse(body);
    
    // Check if user has already voted
    const existingVote = await db.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });
    
    // Update vote counts based on previous vote
    if (existingVote) {
      // If vote type is changing, update both counts
      if (existingVote.isHelpful !== validatedData.isHelpful) {
        await db.review.update({
          where: { id: reviewId },
          data: {
            helpfulVotes: existingVote.isHelpful 
              ? { decrement: 1 } 
              : { increment: 1 },
            unhelpfulVotes: existingVote.isHelpful 
              ? { increment: 1 } 
              : { decrement: 1 },
          },
        });
      }
      
      // Update the vote
      await db.reviewVote.update({
        where: {
          reviewId_userId: {
            reviewId,
            userId: user.id,
          },
        },
        data: {
          isHelpful: validatedData.isHelpful,
        },
      });
    } else {
      // Create a new vote
      await db.reviewVote.create({
        data: {
          reviewId,
          userId: user.id,
          isHelpful: validatedData.isHelpful,
        },
      });
      
      // Update the review vote count
      await db.review.update({
        where: { id: reviewId },
        data: {
          helpfulVotes: validatedData.isHelpful 
            ? { increment: 1 } 
            : { increment: 0 },
          unhelpfulVotes: !validatedData.isHelpful 
            ? { increment: 1 } 
            : { increment: 0 },
        },
      });
    }
    
    // Get updated review
    const updatedReview = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        helpfulVotes: true,
        unhelpfulVotes: true,
      },
    });
    
    return NextResponse.json({
      message: "Vote recorded successfully",
      helpfulVotes: updatedReview?.helpfulVotes || 0,
      unhelpfulVotes: updatedReview?.unhelpfulVotes || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error voting on review:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a vote
export async function DELETE(
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
    });
    
    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }
    
    // Check if user has voted
    const existingVote = await db.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });
    
    if (!existingVote) {
      return NextResponse.json(
        { message: "You have not voted on this review" },
        { status: 400 }
      );
    }
    
    // Update the review vote count
    await db.review.update({
      where: { id: reviewId },
      data: {
        helpfulVotes: existingVote.isHelpful 
          ? { decrement: 1 } 
          : { decrement: 0 },
        unhelpfulVotes: !existingVote.isHelpful 
          ? { decrement: 1 } 
          : { decrement: 0 },
      },
    });
    
    // Delete the vote
    await db.reviewVote.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });
    
    // Get updated review
    const updatedReview = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        helpfulVotes: true,
        unhelpfulVotes: true,
      },
    });
    
    return NextResponse.json({
      message: "Vote removed successfully",
      helpfulVotes: updatedReview?.helpfulVotes || 0,
      unhelpfulVotes: updatedReview?.unhelpfulVotes || 0,
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 