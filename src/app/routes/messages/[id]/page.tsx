import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { ChatInterface } from "@/components/messaging/chat-interface";

interface MessagesPageProps {
  params: {
    id: string;
  };
  searchParams: {
    equipmentId?: string;
  };
}

export default async function MessagesPage({ params, searchParams }: MessagesPageProps) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect("/auth/login");
  }
  
  // Check if the other user exists
  const otherUser = await db.user.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });
  
  if (!otherUser) {
    notFound();
  }
  
  // Get equipment details if equipmentId is provided
  let equipment = null;
  if (searchParams.equipmentId) {
    equipment = await db.equipment.findUnique({
      where: {
        id: searchParams.equipmentId,
      },
      select: {
        id: true,
        title: true,
        ownerId: true,
      },
    });
    
    // Check if the equipment exists
    if (!equipment) {
      notFound();
    }
    
    // Check if one of the users is the owner of the equipment
    if (equipment.ownerId !== currentUser.id && equipment.ownerId !== otherUser.id) {
      // Neither user is the owner, redirect to messages without equipment context
      redirect(`/routes/messages/${params.id}`);
    }
  }
  
  // Get initial messages
  const initialMessages = await db.message.findMany({
    where: {
      OR: [
        {
          senderId: currentUser.id,
          receiverId: otherUser.id,
        },
        {
          senderId: otherUser.id,
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
    take: 50, // Limit to the most recent 50 messages
  });
  
  // Mark all messages from the other user as read
  await db.message.updateMany({
    where: {
      senderId: otherUser.id,
      receiverId: currentUser.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-200px)]">
        <ChatInterface
          currentUserId={currentUser.id}
          otherUserId={otherUser.id}
          otherUserName={otherUser.name || "User"}
          otherUserImage={otherUser.image || undefined}
          initialMessages={initialMessages}
          equipmentId={equipment?.id}
          equipmentTitle={equipment?.title}
        />
      </div>
    </div>
  );
} 