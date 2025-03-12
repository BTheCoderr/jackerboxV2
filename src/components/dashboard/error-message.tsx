"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface ErrorMessageProps {
  error?: string;
  userType: string;
}

export function ErrorMessage({ error, userType }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1" />
      <div>
        <h3 className="font-medium text-red-700">Access Restricted</h3>
        {error === "ownerOnly" && (
          <p className="text-sm text-red-600 mt-1">
            That page is only available to equipment owners. 
            {userType !== "both" && (
              <span> To list equipment, you need to <Link href="/routes/profile/settings" className="underline">update your profile</Link> to be an owner or both.</span>
            )}
          </p>
        )}
        {error === "renterOnly" && (
          <p className="text-sm text-red-600 mt-1">
            That page is only available to renters. 
            {userType !== "both" && (
              <span> To rent equipment, you need to <Link href="/routes/profile/settings" className="underline">update your profile</Link> to be a renter or both.</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
} 