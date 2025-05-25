"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ContactOwnerButtonProps {
  ownerId: string;
  equipmentId: string;
  equipmentTitle: string;
}

export function ContactOwnerButton({
  ownerId,
  equipmentId,
  equipmentTitle
}: ContactOwnerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleContact = async () => {
    try {
      if (!session) {
        toast.error('Please sign in to contact the owner');
        router.push('/auth/signin');
        return;
      }

      setIsLoading(true);
      const response = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: ownerId,
          equipmentId: equipmentId,
          message: `Hi, I'm interested in renting your ${equipmentTitle}. Is it available?`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
      router.push('/messages');
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
      className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? 'Sending...' : 'Contact Owner'}
    </button>
  );
} 