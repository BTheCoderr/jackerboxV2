import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing review voting functionality...');
    
    // 1. Find a test review or create one if none exists
    let testReview = await prisma.review.findFirst({
      where: {
        comment: {
          contains: 'Test review'
        }
      },
      include: {
        author: true,
        votes: true
      }
    });
    
    if (!testReview) {
      console.log('No test review found. Creating one...');
      
      // Find a test user
      const testUser = await prisma.user.findFirst({
        where: {
          email: {
            contains: 'test'
          }
        }
      });
      
      if (!testUser) {
        console.error('No test user found. Please create a test user first.');
        return;
      }
      
      // Find a test equipment
      const testEquipment = await prisma.equipment.findFirst();
      
      if (!testEquipment) {
        console.error('No equipment found. Please create equipment first.');
        return;
      }
      
      // Create a test review
      testReview = await prisma.review.create({
        data: {
          rating: 4,
          comment: 'Test review for voting functionality',
          author: {
            connect: {
              id: testUser.id
            }
          },
          equipment: {
            connect: {
              id: testEquipment.id
            }
          },
          helpfulVotes: 0,
          unhelpfulVotes: 0
        },
        include: {
          author: true,
          votes: true
        }
      });
      
      console.log('Created test review:', testReview);
    } else {
      console.log('Found existing test review:', testReview);
    }
    
    // 2. Find or create test voters
    const testVoters = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test'
        },
        NOT: {
          id: testReview.authorId
        }
      },
      take: 3
    });
    
    if (testVoters.length < 2) {
      console.error('Not enough test users found. Please create at least 2 test users.');
      return;
    }
    
    console.log(`Found ${testVoters.length} test voters`);
    
    // 3. Clear existing votes for this test
    await prisma.reviewVote.deleteMany({
      where: {
        reviewId: testReview.id,
        userId: {
          in: testVoters.map(user => user.id)
        }
      }
    });
    
    console.log('Cleared existing votes');
    
    // 4. Add test votes
    const votes = [
      { userId: testVoters[0].id, isHelpful: true },
      { userId: testVoters[1].id, isHelpful: false }
    ];
    
    if (testVoters.length > 2) {
      votes.push({ userId: testVoters[2].id, isHelpful: true });
    }
    
    for (const vote of votes) {
      await prisma.reviewVote.create({
        data: {
          review: {
            connect: {
              id: testReview.id
            }
          },
          user: {
            connect: {
              id: vote.userId
            }
          },
          isHelpful: vote.isHelpful
        }
      });
      
      console.log(`Added ${vote.isHelpful ? 'helpful' : 'unhelpful'} vote from user ${vote.userId}`);
    }
    
    // 5. Update review vote counts
    const helpfulVotes = await prisma.reviewVote.count({
      where: {
        reviewId: testReview.id,
        isHelpful: true
      }
    });
    
    const unhelpfulVotes = await prisma.reviewVote.count({
      where: {
        reviewId: testReview.id,
        isHelpful: false
      }
    });
    
    await prisma.review.update({
      where: {
        id: testReview.id
      },
      data: {
        helpfulVotes,
        unhelpfulVotes
      }
    });
    
    console.log(`Updated review vote counts: ${helpfulVotes} helpful, ${unhelpfulVotes} unhelpful`);
    
    // 6. Fetch the updated review
    const updatedReview = await prisma.review.findUnique({
      where: {
        id: testReview.id
      },
      include: {
        author: true,
        votes: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('Updated review:', {
      id: updatedReview.id,
      comment: updatedReview.comment,
      helpfulVotes: updatedReview.helpfulVotes,
      unhelpfulVotes: updatedReview.unhelpfulVotes,
      votes: updatedReview.votes.map(vote => ({
        userId: vote.userId,
        userName: vote.user.name,
        isHelpful: vote.isHelpful
      }))
    });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing review votes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 