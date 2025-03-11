"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/messaging/chat-interface";

interface MessagesUserPageProps {
  params: {
    id: string;
  };
  searchParams: {
    equipmentId?: string;
  };
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
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [equipment, setEquipment] = useState<EquipmentData | undefined>(undefined);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/routes/messages");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const otherUserId = params.id;
      const equipmentId = searchParams.equipmentId;

      if (!otherUserId) {
        router.push("/routes/messages");
        return;
      }

      // Fetch other user data
      const fetchOtherUser = async () => {
        try {
          const response = await fetch(`/api/users/${otherUserId}`);
          if (!response.ok) throw new Error("Failed to fetch user");
          const data = await response.json();
          setOtherUser(data.user);
        } catch (error) {
          console.error("Error fetching user:", error);
          router.push("/routes/messages");
        }
      };

      // Fetch equipment data if equipmentId exists
      const fetchEquipment = async () => {
        if (!equipmentId) return;
        
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`);
          if (!response.ok) throw new Error("Failed to fetch equipment");
          const data = await response.json();
          setEquipment({
            id: data.equipment.id,
            title: data.equipment.title
          });
        } catch (error) {
          console.error("Error fetching equipment:", error);
        }
      };

      // Fetch messages
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
          if (!response.ok) throw new Error("Failed to fetch messages");
          const data = await response.json();
          setMessages(data.messages);
          
          // Mark messages as read
          if (data.messages.some((m: Message) => m.senderId === otherUserId && !m.isRead)) {
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
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        } finally {
          setIsLoading(false);
        }
      };

      // Execute all fetches
      Promise.all([fetchOtherUser(), fetchEquipment(), fetchMessages()]);
    }
  }, [status, session, params.id, searchParams.equipmentId, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user || !otherUser) {
    return null;
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