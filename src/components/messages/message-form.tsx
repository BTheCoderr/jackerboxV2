"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MessageFormProps {
  rentalId: string;
}

export function MessageForm({ rentalId }: MessageFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalId,
          content: message.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      // Clear the input and refresh the page
      setMessage("");
      router.refresh();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-end">
      <div className="flex-1 mr-2">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          rows={1}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-black focus:border-black resize-none"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        className="px-4 py-3 bg-black text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
} 