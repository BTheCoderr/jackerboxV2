"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

export function ConnectStripeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectStripe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Stripe Connect account");
      }

      const data = await response.json();
      
      // Redirect to Stripe's onboarding page
      window.location.href = data.url;
    } catch (err) {
      console.error("Error connecting Stripe account:", err);
      setError(err instanceof Error ? err.message : "Failed to connect Stripe account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-600 mb-4 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleConnectStripe}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
      >
        {loading ? "Processing..." : "Connect with Stripe"}
        {!loading && <ExternalLink className="h-4 w-4 ml-2" />}
      </button>
    </div>
  );
} 