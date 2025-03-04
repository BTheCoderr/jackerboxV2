"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RefundSecurityDepositButtonProps {
  rentalId: string;
  securityDepositAmount: number;
}

export function RefundSecurityDepositButton({
  rentalId,
  securityDepositAmount,
}: RefundSecurityDepositButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRefundSecurityDeposit = async () => {
    if (!confirm(`Are you sure you want to refund the security deposit of $${securityDepositAmount.toFixed(2)}?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/refund-security-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rentalId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to refund security deposit");
      }

      const data = await response.json();
      
      toast.success("Security deposit refunded successfully");
      router.refresh();
    } catch (error) {
      console.error("Error refunding security deposit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to refund security deposit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefundSecurityDeposit}
      disabled={isLoading}
      className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Processing..." : "Refund Security Deposit"}
    </button>
  );
} 