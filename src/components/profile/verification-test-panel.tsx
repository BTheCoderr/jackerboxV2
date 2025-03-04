import { useState } from "react";
import { toast } from "sonner";

interface VerificationTestPanelProps {
  userId: string;
  currentStatus: string | null;
  isVerified: boolean | null;
  verificationDate: Date | null;
  onStatusChange: () => void;
}

export function VerificationTestPanel({
  userId,
  currentStatus,
  isVerified,
  verificationDate,
  onStatusChange
}: VerificationTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  const updateVerificationStatus = async (status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test/update-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update verification status");
      }

      toast.success(`Verification status updated to ${status}`);
      onStatusChange();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Test Verification States</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current Status: <span className="font-medium">{currentStatus || "Not started"}</span></p>
        <p className="text-sm text-gray-600 mb-2">Verified: <span className="font-medium">{isVerified ? "Yes" : "No"}</span></p>
        <p className="text-sm text-gray-600">Verification Date: <span className="font-medium">
          {verificationDate ? new Date(verificationDate).toLocaleDateString() : "None"}
        </span></p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateVerificationStatus("pending")}
          disabled={isLoading}
          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
        >
          Set Pending
        </button>
        <button
          onClick={() => updateVerificationStatus("approved")}
          disabled={isLoading}
          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
        >
          Set Approved
        </button>
        <button
          onClick={() => updateVerificationStatus("requires_input")}
          disabled={isLoading}
          className="px-3 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50"
        >
          Set Requires Input
        </button>
        <button
          onClick={() => updateVerificationStatus("canceled")}
          disabled={isLoading}
          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
        >
          Set Canceled
        </button>
        <button
          onClick={() => updateVerificationStatus("reset")}
          disabled={isLoading}
          className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
      
      {isLoading && (
        <p className="text-sm text-gray-500 mt-2">Updating status...</p>
      )}
    </div>
  );
} 