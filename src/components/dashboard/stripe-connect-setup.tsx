"use client";

import { useState } from "react";
import { CheckCircle, ExternalLink } from "lucide-react";
import { ExtendedUser } from "@/lib/auth/session";

interface StripeConnectSetupProps {
  user: ExtendedUser;
}

export function StripeConnectSetup({ user }: StripeConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasStripeAccount = !!user.stripeConnectAccountId;

  const handleConnectStripe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create Stripe Connect account");
      }
      
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      alert("Failed to connect Stripe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-gray-600 mb-4">
            To receive payouts for your equipment rentals, you need to connect your Stripe account.
            By connecting your Stripe account, you'll be able to:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-600">
            <li>Receive automatic payouts for completed rentals</li>
            <li>Track your earnings in one place</li>
            <li>Manage your payout schedule and banking information</li>
          </ul>
          <p className="text-gray-600 mb-6">
            Your information is securely handled by Stripe, and Jackerbox never stores your banking details.
          </p>
        </div>
      </div>

      {hasStripeAccount ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">Your Stripe account is connected</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.open("https://dashboard.stripe.com/", "_blank")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Update Account Details
            </button>
            <button
              onClick={() => window.open("https://dashboard.stripe.com/payouts", "_blank")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              View Payout History
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={handleConnectStripe}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            {isLoading ? "Connecting..." : "Connect with Stripe"}
            {!isLoading && <ExternalLink className="h-4 w-4 ml-2" />}
          </button>
        </div>
      )}
    </div>
  );
} 