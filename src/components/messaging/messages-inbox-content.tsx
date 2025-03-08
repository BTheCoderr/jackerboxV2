'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface MessagesInboxContentProps { 
  conversationsWithDetails: any[];
  currentUserId: string;
}

export function MessagesInboxContent({ 
  conversationsWithDetails, 
  currentUserId 
}: MessagesInboxContentProps) {
  // Force a re-render on the client side to ensure proper styling
  useEffect(() => {
    // This is just to force a re-render on the client
    const forceUpdate = () => {};
    forceUpdate();
  }, []);

  if (conversationsWithDetails.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">No messages yet</h2>
        <p className="text-gray-500 mb-6">When you message someone, they'll appear here.</p>
        <Link 
          href="/routes/equipment" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Browse Equipment
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {conversationsWithDetails.map((conversation) => (
          <li key={conversation.partner.id}>
            <Link 
              href={`/routes/messages/${conversation.partner.id}`}
              className="block hover:bg-gray-50 transition-colors"
            >
              <div className="px-6 py-5 flex items-center">
                <div className="flex-shrink-0 h-12 w-12 relative rounded-full overflow-hidden bg-gray-200">
                  {conversation.partner.image ? (
                    <Image
                      src={conversation.partner.image}
                      alt={conversation.partner.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500 text-white text-xl font-medium">
                      {conversation.partner.name ? conversation.partner.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {conversation.partner.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {conversation.lastMessage.senderId === currentUserId ? (
                        <span className="text-gray-400">You: </span>
                      ) : null}
                      {conversation.lastMessage.content}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 