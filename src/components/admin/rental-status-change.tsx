"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RentalStatusChangeProps {
  rentalId: string;
  currentStatus: string;
}

export function RentalStatusChange({ rentalId, currentStatus }: RentalStatusChangeProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only proceed if status has actually changed
    if (status === currentStatus) {
      toast.error("Please select a different status");
      return;
    }
    
    // If changing to DISPUTED, require a reason
    if (status === "DISPUTED" && !reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/rentals/${rentalId}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reason: status === "DISPUTED" ? reason : undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update rental status");
      }
      
      toast.success(`Rental status updated to ${status}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating rental status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update rental status");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Change Rental Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
          disabled={isLoading}
        >
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="DISPUTED">Disputed</option>
        </select>
      </div>
      
      {status === "DISPUTED" && (
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Dispute Reason
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
            rows={3}
            placeholder="Enter the reason for marking this rental as disputed..."
            disabled={isLoading}
          />
        </div>
      )}
      
      <div>
        <button
          type="submit"
          className={`px-4 py-2 rounded-md text-white ${
            status === currentStatus
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-jacker-blue hover:bg-blue-700"
          }`}
          disabled={isLoading || status === currentStatus}
        >
          {isLoading ? "Updating..." : "Update Status"}
        </button>
        {status !== currentStatus && (
          <p className="mt-2 text-sm text-gray-500">
            Changing status will notify both the renter and owner.
          </p>
        )}
      </div>
    </form>
  );
} 