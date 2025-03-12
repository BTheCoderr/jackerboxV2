"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/messaging/chat-interface";
import { use } from "react";
import { toast } from "sonner";

interface MessagesUserPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    equipmentId?: string;
  }>;
}

interface EquipmentData {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

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

export default function MessagesUserPage({
  params,
  searchParams,
}: MessagesUserPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [equipment, setEquipment] = useState<EquipmentData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/routes/messages/${unwrappedParams.id}${unwrappedSearchParams.equipmentId ? `?equipmentId=${unwrappedSearchParams.equipmentId}` : ''}`);
      return;
    }

    if (status === "authenticated" && session?.user) {
      const otherUserId = unwrappedParams.id;
      const equipmentId = unwrappedSearchParams.equipmentId;

      if (!otherUserId) {
        router.push("/routes/messages");
        return;
      }

      // Fetch other user data
      const fetchOtherUser = async () => {
        try {
          const response = await fetch(`/api/users/${otherUserId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch user");
          }
          const data = await response.json();
          setOtherUser(data.user);
        } catch (error) {
          console.error("Error fetching user:", error);
          setError("Failed to load user information. Please try again.");
          // Don't redirect immediately, let the user see the error
        }
      };

      // Fetch equipment data if equipmentId exists
      const fetchEquipment = async () => {
        if (!equipmentId) return;
        
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch equipment");
          }
          const data = await response.json();
          setEquipment({
            id: data.equipment.id,
            title: data.equipment.title
          });
        } catch (error) {
          console.error("Error fetching equipment:", error);
          // Don't set error for equipment, it's optional
        }
      };

      // Fetch messages
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch messages");
          }
          const data = await response.json();
          setMessages(data.messages);
          
          // Mark messages as read
          if (data.messages && data.messages.length > 0 && 
              data.messages.some((m: Message) => m.senderId === otherUserId && !m.isRead)) {
            try {
              await fetch("/api/messages/mark-read", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messageIds: data.messages
                    .filter((m: Message) => m.senderId === otherUserId && !m.isRead)
                    .map((m: Message) => m.id),
                }),
              });
            } catch (markReadError) {
              console.error("Error marking messages as read:", markReadError);
              // Don't show error to user for this
            }
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          setError("Failed to load messages. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      // Execute all fetches
      Promise.all([fetchOtherUser(), fetchEquipment(), fetchMessages()]).catch(err => {
        console.error("Error in Promise.all:", err);
        setIsLoading(false);
        setError("Something went wrong. Please try again.");
      });
    }
  }, [status, session, unwrappedParams.id, unwrappedSearchParams.equipmentId, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push("/routes/messages")}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  if (!session?.user || !otherUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-600 mb-4">Please sign in to view messages</p>
          <button 
            onClick={() => router.push(`/auth/login?callbackUrl=/routes/messages/${unwrappedParams.id}${unwrappedSearchParams.equipmentId ? `?equipmentId=${unwrappedSearchParams.equipmentId}` : ''}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ChatInterface
        currentUserId={session.user.id}
        otherUserId={otherUser.id}
        otherUserName={otherUser.name || "User"}
        otherUserImage={otherUser.image || undefined}
        initialMessages={messages}
        equipmentId={equipment?.id}
        equipmentTitle={equipment?.title}
      />
    </div>
  );
}