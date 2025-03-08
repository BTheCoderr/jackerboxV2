import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

export default async function MessagesInboxPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect("/auth/login");
  }
  
  // Get all users the current user has exchanged messages with
  const conversations = await db.$queryRaw`
    SELECT 
      CASE 
        WHEN m."senderId" = ${currentUser.id} THEN m."receiverId" 
        ELSE m."senderId" 
      END as "userId",
      MAX(m."createdAt") as "lastMessageAt"
    FROM "Message" m
    WHERE m."senderId" = ${currentUser.id} OR m."receiverId" = ${currentUser.id}
    GROUP BY "userId"
    ORDER BY "lastMessageAt" DESC
  `;
  
  // Get user details and last message for each conversation
  const conversationsWithDetails = await Promise.all(
    (conversations as { userId: string; lastMessageAt: Date }[]).map(async (conversation) => {
      const user = await db.user.findUnique({
        where: {
          id: conversation.userId,
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });
      
      const lastMessage = await db.message.findFirst({
        where: {
          OR: [
            {
              senderId: currentUser.id,
              receiverId: conversation.userId,
            },
            {
              senderId: conversation.userId,
              receiverId: currentUser.id,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          isRead: true,
          senderId: true,
        },
      });
      
      const unreadCount = await db.message.count({
        where: {
          senderId: conversation.userId,
          receiverId: currentUser.id,
          isRead: false,
        },
      });
      
      return {
        user,
        lastMessage,
        unreadCount,
      };
    })
  );
  
  return (
    <MessagesInboxContent conversationsWithDetails={conversationsWithDetails} currentUserId={currentUser.id} />
  );
}

// Client component to ensure proper styling during hot reload
'use client';

import { useEffect } from 'react';

function MessagesInboxContent({ 
  conversationsWithDetails, 
  currentUserId 
}: { 
  conversationsWithDetails: any[],
  currentUserId: string
}) {
  // Force a re-render on client side to ensure styles are applied
  useEffect(() => {
    // This is just to trigger a re-render
    const timer = setTimeout(() => {}, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {conversationsWithDetails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">
              When you have conversations with other users, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {conversationsWithDetails.map(({ user, lastMessage, unreadCount }) => (
              <li key={user.id}>
                <Link
                  href={`/routes/messages/${user.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center px-6 py-5">
                    <div className="relative">
                      <div className="w-12 h-12 relative rounded-full overflow-hidden mr-4">
                        <Image
                          src={user.image || "/images/placeholder-avatar.png"}
                          alt={user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-medium truncate">
                          {user.name || "User"}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p
                          className={`text-sm truncate ${
                            !lastMessage.isRead && lastMessage.senderId !== currentUserId
                              ? "font-medium text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {lastMessage.senderId === currentUserId && "You: "}
                          {lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 