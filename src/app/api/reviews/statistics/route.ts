import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const equipmentId = url.searchParams.get("equipmentId");
    const userId = url.searchParams.get("userId");
    
    if (!equipmentId && !userId) {
      return NextResponse.json(
        { message: "Either equipmentId or userId is required" },
        { status: 400 }
      );
    }
    
    // Build the where clause based on provided parameters
    const where: any = {};
    
    if (equipmentId) {
      where.equipmentId = equipmentId;
    }
    
    if (userId) {
      where.receiverId = userId;
    }
    
    // Get all reviews matching the criteria
    const reviews = await db.review.findMany({
      where,
      select: {
        id: true,
        rating: true
      }
    });
    
    if (reviews.length === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        helpfulVotes: 0,
        unhelpfulVotes: 0
      });
    }
    
    // Calculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    
    // Count reviews by rating
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating]++;
      }
    });
    
    // Get helpfulness votes for these reviews
    const reviewIds = reviews.map(review => review.id);
    const helpfulnessVotes = await db.reviewVote.groupBy({
      by: ['isHelpful'],
      where: {
        reviewId: {
          in: reviewIds
        }
      },
      _count: {
        reviewId: true
      }
    });
    
    // Calculate helpful and unhelpful vote counts
    let helpfulVotes = 0;
    let unhelpfulVotes = 0;
    
    helpfulnessVotes.forEach(vote => {
      if (vote.isHelpful) {
        helpfulVotes = vote._count.reviewId;
      } else {
        unhelpfulVotes = vote._count.reviewId;
      }
    });
    
    return NextResponse.json({
      averageRating,
      totalReviews,
      ratingCounts,
      helpfulVotes,
      unhelpfulVotes
    });
  } catch (error) {
    console.error("Error fetching review statistics:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 