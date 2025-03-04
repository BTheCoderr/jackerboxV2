"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VerificationTestPanel } from "./verification-test-panel";

interface StripeIdentityVerificationProps {
  user: {
    id: string;
    idVerified?: boolean;
    idVerificationStatus?: string | null;
    idVerificationDate?: Date | null;
  };
}

export function StripeIdentityVerification({ user }: StripeIdentityVerificationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const startVerification = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current URL to use as the return URL
      const returnUrl = `${window.location.origin}/routes/profile/edit?verification=complete`;
      
      // Create a verification session
      const response = await fetch("/api/stripe/identity-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create verification session");
      }
      
      // Redirect to the Stripe Identity verification URL
      window.location.href = data.url;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleStatusChange = () => {
    setRefreshKey(prev => prev + 1);
    router.refresh();
  };
  
  // Determine which verification UI to show
  const renderVerificationUI = () => {
    if (user.idVerified) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-medium text-green-800">ID Verified</h3>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your identity has been verified on {user.idVerificationDate ? new Date(user.idVerificationDate).toLocaleDateString() : 'N/A'}.
          </p>
        </div>
      );
    }
    
    if (user.idVerificationStatus === "pending") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800">Verification Pending</h3>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Your ID verification is being processed. We'll notify you once it's complete.
          </p>
        </div>
      );
    }
    
    if (user.idVerificationStatus === "requires_input") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800">Additional Information Required</h3>
          </div>
          <p className="text-sm text-yellow-700 mt-1 mb-3">
            We need additional information to verify your identity. Please try again.
          </p>
          <Button
            onClick={startVerification}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isLoading ? "Loading..." : "Retry Verification"}
          </Button>
        </div>
      );
    }

    if (user.idVerificationStatus === "canceled") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="text-lg font-medium text-red-800">Verification Canceled</h3>
          </div>
          <p className="text-sm text-red-700 mt-1 mb-3">
            Your ID verification was canceled. Please try again when you're ready.
          </p>
          <Button
            onClick={startVerification}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Loading..." : "Restart Verification"}
          </Button>
        </div>
      );
    }
    
    return (
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
        <p className="text-gray-600 mb-4">
          To ensure the safety of our community, we require all users to verify their identity before listing equipment or making rentals.
          We use Stripe Identity, a secure third-party service, to verify your ID.
        </p>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        <Button
          onClick={startVerification}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          {isLoading ? "Loading..." : "Verify with Stripe Identity"}
        </Button>
        
        <p className="text-xs text-gray-500 mt-3">
          You'll be redirected to Stripe's secure verification page. You'll need to provide a valid government-issued ID and take a selfie.
        </p>
      </div>
    );
  };
  
  return (
    <div key={refreshKey}>
      {renderVerificationUI()}
      
      {/* Only show in development environment */}
      {process.env.NODE_ENV !== "production" && (
        <VerificationTestPanel
          userId={user.id}
          currentStatus={user.idVerificationStatus || null}
          isVerified={user.idVerified || false}
          verificationDate={user.idVerificationDate || null}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
} 