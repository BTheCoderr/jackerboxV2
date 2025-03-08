// Server component
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { MessagesInboxContent } from "@/components/messaging/messages-inbox-content";
import { redirect } from "next/navigation";

export default async function MessagesInboxPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch conversations for the current user
  const conversations = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  });

  // Group messages by conversation partner
  const conversationsByUser = new Map();
  
  conversations.forEach(message => {
    const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
    const partner = message.senderId === user.id ? message.receiver : message.sender;
    
    if (!conversationsByUser.has(partnerId)) {
      conversationsByUser.set(partnerId, {
        partner,
        lastMessage: message,
        unreadCount: message.senderId !== user.id && !message.isRead ? 1 : 0
      });
    } else {
      const conversation = conversationsByUser.get(partnerId);
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message;
      }
      if (message.senderId !== user.id && !message.isRead) {
        conversation.unreadCount += 1;
      }
    }
  });
  
  // Convert map to array and sort by last message date
  const conversationsWithDetails = Array.from(conversationsByUser.values())
    .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <MessagesInboxContent 
        conversationsWithDetails={conversationsWithDetails}
        currentUserId={user.id}
      />
    </div>
  );
} 