"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <p>No messages yet</p>
        <p className="text-sm mt-1">Start the conversation by sending a message below</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.sender.id === currentUserId;
        
        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-end">
              {!isCurrentUser && (
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                    {message.sender.image ? (
                      <img
                        src={message.sender.image}
                        alt={message.sender.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-bold">
                        {message.sender.name
                          ? message.sender.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                  isCurrentUser
                    ? "bg-black text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${isCurrentUser ? "text-gray-300" : "text-gray-500"}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 