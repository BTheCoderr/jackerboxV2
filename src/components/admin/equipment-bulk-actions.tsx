"use client";

import { useState } from "react";
import { toast } from "sonner";

export function EquipmentBulkActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  
  const handleBulkAction = async () => {
    if (!selectedAction) return;
    
    const selectedItems = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:checked:not([data-select-all])'
    );
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    
    const itemIds = Array.from(selectedItems).map((item) => 
      item.closest("tr")?.dataset.equipmentId
    ).filter(Boolean);
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/equipment/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: selectedAction,
          equipmentIds: itemIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to perform bulk action");
      }
      
      toast.success(`Successfully performed ${selectedAction} on ${itemIds.length} items`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to perform bulk action");
      console.error("Bulk action error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:not([data-select-all])'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  };
  
  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          className="rounded border-gray-300"
          onChange={handleSelectAll}
          data-select-all
        />
        <select
          className="p-2 border rounded-md"
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select Action</option>
          <option value="approve">Approve Selected</option>
          <option value="reject">Reject Selected</option>
          <option value="flag">Flag for Review</option>
          <option value="delete">Delete Selected</option>
          <option value="export">Export Selected</option>
        </select>
        <button
          onClick={handleBulkAction}
          disabled={!selectedAction || isLoading}
          className={`px-4 py-2 rounded-md ${
            !selectedAction || isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-jacker-blue text-white hover:bg-opacity-90"
          }`}
        >
          {isLoading ? "Processing..." : "Apply"}
        </button>
      </div>
    </div>
  );
} 