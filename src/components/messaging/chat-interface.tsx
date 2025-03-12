"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "@/hooks/use-socket";
import { PaperclipIcon, X, Image as ImageIcon, File, Send, AlertTriangle, RefreshCw } from "lucide-react";
import { SocketStatus } from "./socket-status";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  isRead: boolean;
  attachments?: {
    type: string;
    url: string;
    name: string;
    size?: number;
  }[];
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ChatInterfaceProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  initialMessages?: Message[];
  equipmentId?: string;
  equipmentTitle?: string;
}

export function ChatInterface({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserImage,
  initialMessages = [],
  equipmentId,
  equipmentTitle,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Add connection status state
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'fallback'>('connected');
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  // Generate a unique chat ID for this conversation
  const chatId = [currentUserId, otherUserId].sort().join('-');
  
  // Initialize socket connection
  const { socket, isConnected, isPollingFallback, joinChat, leaveChat, sendMessage: socketSendMessage, subscribe } = useSocket();
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [otherUserId]);
  
  // Join chat room when connected
  useEffect(() => {
    if (isConnected) {
      joinChat(chatId);
    }
    
    return () => {
      if (isConnected) {
        leaveChat(chatId);
      }
    };
  }, [isConnected, joinChat, leaveChat, chatId]);
  
  // Subscribe to socket events
  useEffect(() => {
    // Handle receiving messages
    const unsubscribeMessage = subscribe("receive_message", (data: Message) => {
      setMessages((prevMessages) => {
        // Check if message already exists to prevent duplicates
        if (prevMessages.some((msg) => msg.id === data.id)) {
          return prevMessages;
        }
        return [...prevMessages, data];
      });
    });
    
    // Handle typing indicators
    const unsubscribeTyping = subscribe("user_typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === otherUserId) {
        setOtherUserTyping(data.isTyping);
        
        // Auto-clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    });
    
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [subscribe, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      try {
        const unreadMessages = messages.filter(
          (msg) => !msg.isRead && msg.senderId === otherUserId
        );
        
        if (unreadMessages.length === 0) return;
        
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageIds: unreadMessages.map((msg) => msg.id),
          }),
        });
        
        // Update local messages to mark as read
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.senderId === otherUserId ? { ...msg, isRead: true } : msg
          )
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [messages, otherUserId]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 5 files at a time
      if (attachments.length + newFiles.length > 5) {
        setError("You can only attach up to 5 files at a time.");
        return;
      }
      
      // Limit file size to 10MB each
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError("Files must be smaller than 10MB each.");
        return;
      }
      
      setAttachments([...attachments, ...newFiles]);
      setError(null);
    }
  };
  
  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  // Upload attachments to server
  const uploadAttachments = async (): Promise<{ type: string; url: string; name: string; size?: number }[]> => {
    if (attachments.length === 0) return [];
    
    setIsUploading(true);
    
    try {
      const uploadPromises = attachments.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        
        return {
          type: file.type.startsWith("image/") ? "image" : "file",
          url: data.url,
          name: file.name,
          size: file.size,
        };
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading attachments:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Update connection status based on socket state
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus(isPollingFallback ? 'fallback' : 'connected');
      setShowReconnectButton(false);
    } else {
      setConnectionStatus('disconnected');
      setShowReconnectButton(true);
    }
  }, [isConnected, isPollingFallback]);

  // Add a function to manually reconnect
  const handleReconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  // Modify the handleSendMessage function to work with or without socket connection
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) return;
    
    setIsLoading(true);
    
    try {
      let uploadedAttachments: { type: string; url: string; name: string; size?: number }[] = [];
      
      if (attachments.length > 0) {
        uploadedAttachments = await uploadAttachments();
      }
      
      const messageData = {
        content: newMessage.trim(),
        senderId: currentUserId,
        receiverId: otherUserId,
        attachments: uploadedAttachments,
      };
      
      // Try to send via socket first if connected
      let socketSent = false;
      if (isConnected) {
        socketSent = socketSendMessage(otherUserId, messageData);
      }
      
      // If socket failed or not connected, send via REST API
      if (!socketSent) {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage.trim(),
            receiverId: otherUserId,
            attachments: uploadedAttachments,
            equipmentId,
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to send message");
        }
        
        const data = await response.json();
        
        // Add the new message to the state
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            createdAt: new Date(data.message.createdAt),
            sender: {
              id: currentUserId,
              name: "You",
              image: null,
            },
          },
        ]);
      }
      
      // Clear the input and attachments
      setNewMessage("");
      setAttachments([]);
      
      // Scroll to the bottom
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      
      // Auto-clear typing indicator after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b">
        <div className="w-10 h-10 relative rounded-full overflow-hidden mr-3">
          {otherUserImage ? (
            <Image
              src={otherUserImage}
              alt={otherUserName || "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-semibold">
              {otherUserName ? otherUserName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium">{otherUserName}</h3>
          {equipmentTitle && (
            <p className="text-sm text-gray-500">
              Re: {equipmentTitle}
            </p>
          )}
        </div>
      </div>

      {/* Socket status notification */}
      <div className="px-4 pt-2">
        <SocketStatus showReconnectButton={true} />
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-2"
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
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) :
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.senderId !== currentUserId && (
                  <div className="w-8 h-8 relative rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <Image
                      src={message.sender?.image || otherUserImage || "/images/placeholder-avatar.png"}
                      alt={message.sender?.name || otherUserName || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content && <p className="mb-2">{message.content}</p>}
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index}>
                          {attachment.type === "image" ? (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="relative w-full h-32 rounded-md overflow-hidden mb-1">
                                <Image
                                  src={attachment.url}
                                  alt={attachment.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <p className={`text-xs ${
                                message.senderId === currentUserId
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}>
                                {attachment.name}
                              </p>
                            </a>
                          ) : (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex items-center p-2 rounded ${
                                message.senderId === currentUserId
                                  ? "bg-blue-600"
                                  : "bg-gray-200"
                              }`}
                            >
                              <File className={`h-4 w-4 mr-2 ${
                                message.senderId === currentUserId
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`} />
                              <div className="overflow-hidden">
                                <p className={`text-xs truncate ${
                                  message.senderId === currentUserId
                                    ? "text-white"
                                    : "text-gray-800"
                                }`}>
                                  {attachment.name}
                                </p>
                                {attachment.size && (
                                  <p className={`text-xs ${
                                    message.senderId === currentUserId
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}>
                                    {formatFileSize(attachment.size)}
                                  </p>
                                )}
                              </div>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                    {message.senderId === currentUserId && (
                      <span className="ml-2">
                        {message.isRead ? "Read" : "Sent"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        }
      </div>

      {/* Typing Indicator */}
      {otherUserTyping && (
        <div className="px-4 py-2 text-xs text-gray-500">
          {otherUserName} is typing...
        </div>
      )}

      {/* Fallback Connection Mode Banner */}
      {connectionStatus !== 'connected' && (
        <div className="px-4 py-2 text-xs bg-amber-50 border-t border-amber-100">
          <div className="flex items-center">
            <AlertTriangle size={14} className="text-amber-500 mr-2" />
            <span>
              {connectionStatus === 'fallback' 
                ? "Using limited connection mode. Messages will still be sent, but you may need to refresh to see new messages."
                : "You're currently offline. Messages will be sent when your connection is restored."}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
          <div className="flex items-center">
            <AlertTriangle size={14} className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t">
          <div className="text-sm font-medium mb-2">Attachments ({attachments.length})</div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div 
                key={index} 
                className="relative bg-gray-100 rounded-md p-2 flex items-center"
              >
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
                ) : (
                  <File className="h-4 w-4 mr-2 text-gray-500" />
                )}
                <div className="max-w-[150px]">
                  <p className="text-xs truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            disabled={isLoading || isUploading}
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
            disabled={isLoading || isUploading || (!newMessage.trim() && attachments.length === 0)}
          >
            {isLoading || isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {isUploading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
              <span>Uploading attachments...</span>
            </div>
          ) : (
            <span>Attach up to 5 files (10MB max each)</span>
          )}
        </div>
      </form>
    </div>
  );
} 