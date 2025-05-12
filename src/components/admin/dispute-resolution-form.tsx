"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DisputeResolutionFormProps {
  rentalId: string;
}

export function DisputeResolutionForm({ rentalId }: DisputeResolutionFormProps) {
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState<"FAVOR_RENTER" | "FAVOR_OWNER" | "COMPROMISE">("COMPROMISE");
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolution.trim()) {
      toast.error("Please provide a resolution explanation");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/disputes/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalId,
          resolution,
          outcome,
          refundAmount: outcome === "FAVOR_RENTER" || outcome === "COMPROMISE" ? refundAmount : null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resolve dispute");
      }
      
      toast.success("Dispute resolved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resolve dispute");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-red-50 p-6 border border-red-100 rounded-md">
      <h3 className="text-lg font-medium text-red-800 mb-4">Resolve Dispute</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
            Resolution Outcome
          </label>
          <select
            id="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as any)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
            required
          >
            <option value="COMPROMISE">Compromise (partial refund)</option>
            <option value="FAVOR_RENTER">In favor of renter (full refund)</option>
            <option value="FAVOR_OWNER">In favor of owner (no refund)</option>
          </select>
        </div>
        
        {(outcome === "FAVOR_RENTER" || outcome === "COMPROMISE") && (
          <div>
            <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount ($)
            </label>
            <input
              type="number"
              id="refundAmount"
              value={refundAmount || ""}
              onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
              min={0}
              step="0.01"
              required
              placeholder={outcome === "FAVOR_RENTER" ? "Enter full amount" : "Enter partial refund amount"}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
            Resolution Explanation
          </label>
          <textarea
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
            rows={4}
            required
            placeholder="Provide a detailed explanation of your decision..."
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading || !resolution.trim() || (outcome !== "FAVOR_OWNER" && refundAmount === null)}
          >
            {isLoading ? "Processing..." : "Resolve Dispute"}
          </button>
          <p className="mt-2 text-sm text-gray-500">
            This action is final and will notify both parties of your decision.
          </p>
        </div>
      </form>
    </div>
  );
} 