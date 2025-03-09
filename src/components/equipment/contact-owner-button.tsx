"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ContactOwnerButtonProps {
  ownerId: string;
  equipmentId: string;
  equipmentTitle: string;
}

export function ContactOwnerButton({ ownerId, equipmentId, equipmentTitle }: ContactOwnerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContactOwner = async () => {
    setIsLoading(true);
    try {
      // First, create a conversation and send initial message
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: ownerId,
          content: `Hi, I'm interested in renting your "${equipmentTitle}". Is it available?`,
          equipmentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      // Create a notification for the owner
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: ownerId,
          type: "NEW_RENTAL_INQUIRY",
          title: "New Rental Inquiry",
          message: `Someone is interested in renting your "${equipmentTitle}"`,
          linkUrl: `/routes/messages/${data.senderId}?equipmentId=${equipmentId}`,
        }),
      });

      toast.success("Message sent to the owner!");
      
      // Redirect to the messages page
      router.push(`/routes/messages/${ownerId}?equipmentId=${equipmentId}`);
    } catch (error) {
      console.error("Error contacting owner:", error);
      toast.error("Failed to contact owner. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleContactOwner}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full"
    >
      {isLoading ? "Sending..." : "Contact Owner"}
    </button>
  );
} 