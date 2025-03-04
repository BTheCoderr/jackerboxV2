"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProcessPayoutButtonProps {
  rentalId: string;
  paymentId: string;
}

export function ProcessPayoutButton({ rentalId, paymentId }: ProcessPayoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProcessPayout = async () => {
    if (!confirm("Are you sure you want to process this payout?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/process-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rentalId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process payout");
      }

      const data = await response.json();
      
      toast.success("Payout processed successfully");
      router.refresh();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleProcessPayout}
      disabled={isLoading}
      className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Processing..." : "Process Payout"}
    </button>
  );
} 