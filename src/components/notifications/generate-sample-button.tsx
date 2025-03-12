"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateSampleNotificationsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const generateSampleNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/sample", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate sample notifications");
      }

      // Refresh the page to show the new notifications
      router.refresh();
    } catch (error) {
      console.error("Error generating sample notifications:", error);
      alert("Failed to generate sample notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={generateSampleNotifications}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {isLoading ? "Generating..." : "Generate Sample Notifications"}
    </button>
  );
} 