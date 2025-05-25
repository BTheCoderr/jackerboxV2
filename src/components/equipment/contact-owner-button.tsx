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

  const handleContact = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: ownerId,
          equipmentId: equipmentId,
          message: `Hi, I'm interested in renting your ${equipmentTitle}. Is it available?`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Redirect to the messages page
      router.push(`/routes/messages/${data.conversationId}`);
      toast.success('Message sent to owner');
      
    } catch (error) {
      console.error('Error contacting owner:', error);
      toast.error('Failed to contact owner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleContact}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Sending...' : 'Contact Owner'}
    </button>
  );
} 