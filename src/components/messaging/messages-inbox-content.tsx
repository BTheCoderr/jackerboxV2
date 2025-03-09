'use client';

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface MessagesInboxContentProps { 
  conversationsWithDetails: Array<{
    otherUser: {
      id: string;
      name: string | null;
      image: string | null;
    };
    lastMessage: {
      id: string;
      content: string;
      createdAt: Date;
      isRead: boolean;
      equipmentId?: string | null;
    };
    unreadCount: number;
  }>;
  currentUserId: string;
}

export function MessagesInboxContent({ 
  conversationsWithDetails, 
  currentUserId 
}: MessagesInboxContentProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  
  const filteredConversations = activeFilter === 'all' 
    ? conversationsWithDetails 
    : conversationsWithDetails.filter(conv => conv.unreadCount > 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold">Conversations</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {activeFilter === 'unread' ? 'No unread messages' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link
              key={conversation.otherUser.id}
              href={`/routes/messages/${conversation.otherUser.id}${conversation.lastMessage.equipmentId ? `?equipmentId=${conversation.lastMessage.equipmentId}` : ''}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {conversation.otherUser.image ? (
                    <img 
                      src={conversation.otherUser.image} 
                      alt={conversation.otherUser.name || "User"} 
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder-avatar.svg";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {conversation.otherUser.name ? conversation.otherUser.name.charAt(0).toUpperCase() : "?"}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium truncate">
                      {conversation.otherUser.name || "User"}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conversation.lastMessage.content}
                  </p>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <div className="ml-3 flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-medium">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 