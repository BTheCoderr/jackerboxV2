"use client";

import { useRouter } from "next/navigation";

interface EquipmentFiltersProps {
  searchParams: {
    category?: string;
    status?: string;
    moderation?: string;
    page?: string;
  };
  categories: string[];
}

export function EquipmentFilters({ searchParams, categories }: EquipmentFiltersProps) {
  const router = useRouter();

  const handleCategoryChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("category", value);
    router.push(url.pathname + url.search);
  };

  const handleStatusChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("status", value);
    router.push(url.pathname + url.search);
  };

  const handleModerationChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("moderation", value);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <select
        className="p-2 border rounded-md"
        onChange={(e) => handleCategoryChange(e.target.value)}
        value={searchParams.category || ""}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      
      <select
        className="p-2 border rounded-md"
        onChange={(e) => handleStatusChange(e.target.value)}
        value={searchParams.status || ""}
      >
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      
      <select
        className="p-2 border rounded-md"
        onChange={(e) => handleModerationChange(e.target.value)}
        value={searchParams.moderation || ""}
      >
        <option value="">All Moderation Status</option>
        <option value="pending">Pending Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="flagged">Flagged</option>
      </select>
    </div>
  );
} 