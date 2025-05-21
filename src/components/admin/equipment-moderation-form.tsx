"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { ModerationStatus } from '../../../prisma/generated/client';
import { toast } from "sonner";

interface EquipmentModerationFormProps {
  equipment: {
    id: string;
    title: string;
    moderationStatus: string;
    moderationNotes?: string | null;
  };
}

export function EquipmentModerationForm({ equipment }: EquipmentModerationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<string>(equipment.moderationStatus);
  const [moderationNotes, setModerationNotes] = useState<string>(equipment.moderationNotes || "");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/equipment/${equipment.id}/moderate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moderationStatus,
          moderationNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update moderation status");
      }
      
      toast.success("Moderation status updated successfully");
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update moderation status");
      console.error("Moderation error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-4">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Content Moderation</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moderation Status
          </label>
          <select
            value={moderationStatus}
            onChange={(e) => setModerationStatus(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value={ModerationStatus.PENDING}>Pending Review</option>
            <option value={ModerationStatus.APPROVED}>Approved</option>
            <option value={ModerationStatus.REJECTED}>Rejected</option>
            <option value={ModerationStatus.FLAGGED}>Flagged for Review</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moderation Notes
          </label>
          <textarea
            value={moderationNotes}
            onChange={(e) => setModerationNotes(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Add notes about this moderation decision..."
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md ${
            isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : moderationStatus === ModerationStatus.APPROVED
              ? "bg-green-600 hover:bg-green-700 text-white"
              : moderationStatus === ModerationStatus.REJECTED
              ? "bg-red-600 hover:bg-red-700 text-white"
              : moderationStatus === ModerationStatus.FLAGGED
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isLoading ? "Processing..." : "Update Moderation Status"}
        </button>
        
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => window.open(`/routes/equipment/${equipment.id}`, "_blank")}
              className="w-full py-2 px-4 bg-gray-100 text-center rounded-md hover:bg-gray-200"
            >
              View Public Listing
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this equipment listing? This action cannot be undone.")) {
                  fetch(`/api/admin/equipment/${equipment.id}`, {
                    method: "DELETE",
                  })
                    .then((response) => {
                      if (!response.ok) throw new Error("Failed to delete equipment");
                      toast.success("Equipment deleted successfully");
                      window.location.href = "/routes/admin/equipment";
                    })
                    .catch((error) => {
                      toast.error("Failed to delete equipment");
                      console.error("Delete error:", error);
                    });
                }
              }}
              className="w-full py-2 px-4 bg-red-100 text-red-700 text-center rounded-md hover:bg-red-200"
            >
              Delete Equipment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 