"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

interface UserFiltersProps {
  searchParams: {
    verified?: string;
    role?: string;
    search?: string;
    page?: string;
  };
}

export function UserFilters({ searchParams }: UserFiltersProps) {
  const router = useRouter();

  const handleVerifiedChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("verified", value);
    router.push(url.pathname + url.search);
  };

  const handleRoleChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("role", value);
    router.push(url.pathname + url.search);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    
    const url = new URL(window.location.href);
    url.searchParams.set("search", searchValue);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <select
        className="p-2 border rounded-md"
        onChange={(e) => handleVerifiedChange(e.target.value)}
        value={searchParams.verified || ""}
      >
        <option value="">All Verification Status</option>
        <option value="true">Verified</option>
        <option value="false">Not Verified</option>
      </select>
      
      <select
        className="p-2 border rounded-md"
        onChange={(e) => handleRoleChange(e.target.value)}
        value={searchParams.role || ""}
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      
      <div className="md:col-span-2">
        <form
          onSubmit={handleSearchSubmit}
          className="flex"
        >
          <input
            type="text"
            name="search"
            placeholder="Search by name or email"
            className="flex-1 p-2 border rounded-l-md"
            defaultValue={searchParams.search || ""}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-jacker-blue text-white rounded-r-md hover:bg-opacity-90"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
} 