"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Rental {
  id: string;
  status: string;
  equipment: {
    id: string;
    title: string;
    ownerId: string;
  };
  renterId: string;
  payment?: {
    id: string;
    status: string;
  } | null;
}

interface RentalActionsProps {
  rental: Rental;
  isOwner: boolean;
}

export function RentalActions({ rental, isOwner }: RentalActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateRentalStatus = async (status: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rentals/${rental.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update rental status");
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPayment = () => {
    router.push(`/routes/rentals/${rental.id}/payment`);
  };
  
  // No actions for completed or cancelled rentals
  if (rental.status === "Completed" || rental.status === "Cancelled") {
    return null;
  }
  
  // Actions for owner
  if (isOwner) {
    if (rental.status === "Pending") {
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Actions</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => updateRentalStatus("Approved")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-green-600 text-white text-center rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Approve Rental"}
            </button>
            <button
              onClick={() => updateRentalStatus("Rejected")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-red-600 text-white text-center rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Reject Rental"}
            </button>
          </div>
        </div>
      );
    }
    
    if (rental.status === "Approved") {
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Actions</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => updateRentalStatus("Completed")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Mark as Completed"}
            </button>
            <button
              onClick={() => updateRentalStatus("Cancelled")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Cancel Rental"}
            </button>
          </div>
        </div>
      );
    }
  }
  
  // Actions for renter
  else {
    if (rental.status === "Pending") {
      const hasPayment = rental.payment && rental.payment.status === "COMPLETED";
      
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Actions</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            {!hasPayment && (
              <button
                onClick={navigateToPayment}
                className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
              >
                Make Payment
              </button>
            )}
            <button
              onClick={() => updateRentalStatus("Cancelled")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Cancel Request"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {hasPayment 
              ? "Payment completed. Waiting for owner approval." 
              : "Please complete payment to proceed with your rental request."}
          </p>
        </div>
      );
    }
    
    if (rental.status === "Approved") {
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Actions</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => updateRentalStatus("Completed")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Mark as Completed"}
            </button>
            <button
              onClick={() => updateRentalStatus("Cancelled")}
              disabled={isLoading}
              className="block w-full py-2 px-4 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Cancel Rental"}
            </button>
          </div>
        </div>
      );
    }
    
    if (rental.status === "Rejected") {
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Rental Rejected</h3>
          <p className="text-sm text-gray-500">
            Your rental request has been rejected by the owner.
          </p>
          <div className="mt-4">
            <Link
              href="/routes/equipment"
              className="block w-full py-2 px-4 bg-black text-white text-center rounded-md hover:bg-opacity-80"
            >
              Browse Other Equipment
            </Link>
          </div>
        </div>
      );
    }
  }
  
  return null;
} 