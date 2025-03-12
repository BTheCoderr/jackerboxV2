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
      // First, switch to simple calendar view if it exists
      const calendarToggleButton = document.querySelector('button[class*="text-blue-600"]');
      if (calendarToggleButton && calendarToggleButton.textContent?.includes('Simple')) {
        (calendarToggleButton as HTMLButtonElement).click();
      }
      
      // Set default dates in the simple calendar if inputs exist
      setTimeout(() => {
        const startDateInput = document.getElementById('start-date') as HTMLInputElement;
        const endDateInput = document.getElementById('end-date') as HTMLInputElement;
        
        if (startDateInput && endDateInput) {
          // Set start date to today
          const today = new Date();
          const formattedToday = today.toISOString().split('T')[0];
          startDateInput.value = formattedToday;
          
          // Set end date to tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const formattedTomorrow = tomorrow.toISOString().split('T')[0];
          endDateInput.value = formattedTomorrow;
          
          // Trigger change events to update any listeners
          startDateInput.dispatchEvent(new Event('change', { bubbles: true }));
          endDateInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 100);

      // Create a conversation and send initial message
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