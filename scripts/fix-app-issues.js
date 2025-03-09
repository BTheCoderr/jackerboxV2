import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function fixCalendarIssue() {
  console.log('🔧 Fixing availability calendar issue...');
  
  const calendarComponentPath = path.join(__dirname, '../src/components/equipment/availability-calendar.tsx');
  
  try {
    let content = await fs.readFile(calendarComponentPath, 'utf8');
    
    // Fix the generateRecurringDates function - it's missing the opening brace
    if (content.includes('const generateRecurringDates = () =>')) {
      content = content.replace(
        'const generateRecurringDates = () =>',
        'const generateRecurringDates = () => {'
      );
      
      // Fix the closing brace for the function
      content = content.replace(
        'return dates;',
        'return dates;\n  }'
      );
    }
    
    // Fix the handleSaveAvailability function - it's missing an else statement
    if (content.includes('if (isRecurring && recurrenceEndDate) {')) {
      content = content.replace(
        '      }',
        '      } else {'
      );
      
      // Add the missing closing brace for the else statement
      content = content.replace(
        '      }',
        '      }\n      }'
      );
    }
    
    await fs.writeFile(calendarComponentPath, content);
    console.log('✅ Fixed availability calendar component');
  } catch (error) {
    console.error('Error fixing calendar issue:', error);
  }
}

async function fixContactOwnerIssue() {
  console.log('🔧 Fixing contact owner issue...');
  
  // Create the messages/[userId] directory and page if it doesn't exist
  const messagesUserDirPath = path.join(__dirname, '../src/app/routes/messages/[userId]');
  const messagesUserPagePath = path.join(messagesUserDirPath, 'page.tsx');
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(messagesUserDirPath, { recursive: true });
    
    // Create the page.tsx file
    const pageContent = `import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ChatInterface } from "@/components/messaging/chat-interface";

interface MessagesUserPageProps {
  params: {
    userId: string;
  };
  searchParams: {
    equipmentId?: string;
  };
}

export default async function MessagesUserPage({
  params,
  searchParams,
}: MessagesUserPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login?callbackUrl=/routes/messages");
  }

  const otherUserId = params.userId;
  const equipmentId = searchParams.equipmentId;

  // Fetch the other user's details
  const otherUser = await db.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!otherUser) {
    redirect("/routes/messages");
  }

  // Fetch equipment details if equipmentId is provided
  let equipment = null;
  if (equipmentId) {
    equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });
  }

  // Fetch existing messages between the two users
  const messages = await db.message.findMany({
    where: {
      OR: [
        {
          senderId: currentUser.id,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: currentUser.id,
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

  // Mark unread messages as read
  if (messages.some(m => m.senderId === otherUserId && !m.isRead)) {
    await db.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ChatInterface
        currentUserId={currentUser.id}
        otherUserId={otherUser.id}
        otherUserName={otherUser.name || "User"}
        otherUserImage={otherUser.image}
        initialMessages={messages}
        equipmentId={equipment?.id}
        equipmentTitle={equipment?.title}
      />
    </div>
  );
}`;

    await fs.writeFile(messagesUserPagePath, pageContent);
    console.log('✅ Created messages/[userId]/page.tsx');
  } catch (error) {
    console.error('Error fixing contact owner issue:', error);
  }
}

async function createSampleReviews() {
  console.log('🔧 Creating sample reviews...');
  
  try {
    // Get equipment items
    const equipment = await prisma.equipment.findMany({
      take: 5,
      include: {
        owner: true,
      },
    });
    
    if (equipment.length === 0) {
      console.log('No equipment found to add reviews to');
      return;
    }
    
    // Get users who are not equipment owners
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: equipment.map(e => e.ownerId),
        },
      },
      take: 3,
    });
    
    if (users.length === 0) {
      console.log('No users found to create reviews');
      return;
    }
    
    // Sample review data
    const reviewData = [
      {
        rating: 5,
        comment: "Excellent equipment! It was in perfect condition and worked flawlessly. The owner was very helpful and provided clear instructions. I would definitely rent this again.",
        helpfulVotes: 3,
        unhelpfulVotes: 0,
      },
      {
        rating: 4,
        comment: "Very good equipment, almost new. The owner was responsive and accommodating with pickup and return times. Only giving 4 stars because the battery life was a bit shorter than expected, but otherwise great!",
        helpfulVotes: 2,
        unhelpfulVotes: 1,
      },
      {
        rating: 5,
        comment: "Amazing experience! The equipment was exactly as described and the owner was super friendly. The rental process was smooth and hassle-free. Highly recommend!",
        helpfulVotes: 5,
        unhelpfulVotes: 0,
      },
      {
        rating: 3,
        comment: "The equipment worked fine but had some minor issues. It was a bit worn out compared to what was shown in the photos. The owner was nice though and helped troubleshoot the problems.",
        helpfulVotes: 1,
        unhelpfulVotes: 0,
      },
      {
        rating: 5,
        comment: "Top-notch equipment and service! Everything was in pristine condition and the owner even threw in some extra accessories for free. Will definitely rent from them again!",
        helpfulVotes: 4,
        unhelpfulVotes: 0,
      }
    ];
    
    // Create reviews for each equipment
    for (const item of equipment) {
      // Randomly select 1-3 users to leave reviews
      const reviewers = users.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      
      for (const user of reviewers) {
        // Select a random review template
        const reviewTemplate = reviewData[Math.floor(Math.random() * reviewData.length)];
        
        // Create the review
        const review = await prisma.review.create({
          data: {
            rating: reviewTemplate.rating,
            comment: reviewTemplate.comment,
            helpfulVotes: reviewTemplate.helpfulVotes,
            unhelpfulVotes: reviewTemplate.unhelpfulVotes,
            equipment: {
              connect: { id: item.id }
            },
            author: {
              connect: { id: user.id }
            }
          },
        });
        
        // 50% chance of owner response
        if (Math.random() > 0.5) {
          await prisma.review.update({
            where: { id: review.id },
            data: {
              ownerResponse: "Thank you for your review! We're glad you had a good experience and hope to see you again soon.",
              ownerResponseDate: new Date(),
            },
          });
        }
        
        console.log(`✅ Created review for ${item.title} by ${user.name || 'User'}`);
      }
    }
    
    console.log('✅ Sample reviews created successfully');
  } catch (error) {
    console.error('Error creating sample reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting to fix application issues...');
  
  await Promise.all([
    fixCalendarIssue(),
    fixContactOwnerIssue(),
  ]);
  
  await createSampleReviews();
  
  console.log('\n✨ All fixes applied successfully!');
}

main().catch(console.error); 