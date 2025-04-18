import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";

export async function GET(
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
    
    // Get user's vote
    const vote = await db.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });
    
    return NextResponse.json({
      hasVoted: !!vote,
      vote: vote ? vote.isHelpful : null
    });
  } catch (error) {
    console.error("Error getting user vote:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 