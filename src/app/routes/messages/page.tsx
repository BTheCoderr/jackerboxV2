export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MessagesInboxContent } from "@/components/messaging/messages-inbox-content";

export const metadata: Metadata = {
  title: "Messages | Jackerbox",
  description: "Your messages on Jackerbox",
};

export default async function MessagesInboxPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login?callbackUrl=/routes/messages");
  }

  try {
    // Get all conversations for the current user
    const conversations = await db.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Group messages by conversation (other user)
    const conversationMap = new Map();

    conversations.forEach((message) => {
      const otherUser = message.senderId === currentUser.id ? message.receiver : message.sender;
      const conversationId = otherUser.id;
      
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          otherUser,
          lastMessage: message,
          unreadCount: message.senderId !== currentUser.id && !message.isRead ? 1 : 0,
        });
      } else {
        const conversation = conversationMap.get(conversationId);
        if (message.createdAt > conversation.lastMessage.createdAt) {
          conversation.lastMessage = message;
        }
        if (message.senderId !== currentUser.id && !message.isRead) {
          conversation.unreadCount += 1;
        }
      }
    });

    // Convert map to array and sort by last message date
    const conversationsWithDetails = Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        {conversationsWithDetails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-gray-600 mb-4">
              When you message equipment owners or receive messages, they'll appear here.
            </p>
            <a href="/routes/equipment" className="text-blue-600 hover:underline">
              Browse equipment to rent
            </a>
          </div>
        ) : (
          <MessagesInboxContent 
            conversationsWithDetails={conversationsWithDetails} 
            currentUserId={currentUser.id} 
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading messages:", error);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">Error loading messages. Please try again later.</p>
        </div>
      </div>
    );
  }
} 