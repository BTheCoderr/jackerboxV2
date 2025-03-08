export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ConnectStripeButton } from "@/components/stripe/connect-stripe-button";

export const metadata: Metadata = {
  title: "Stripe Connect Setup | Jackerbox",
  description: "Connect your Stripe account to receive payments",
};

interface StripeConnectPageProps {
  searchParams: {
    success?: string;
    error?: string;
  };
}

export default async function StripeConnectPage({ searchParams }: StripeConnectPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard/stripe-connect");
  }

  const isSuccess = searchParams.success === "true";
  const isError = searchParams.error === "true";

  // Check if the user has a Stripe Connect account
  const hasStripeAccount = !!user.stripeConnectAccountId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Connect Setup</h1>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>Unexpected token 'E', "Error crea"... is not valid JSON</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Success!</p>
            <p>Your Stripe Connect account has been set up successfully.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Connect Your Stripe Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start mb-6">
            <div className="bg-blue-50 p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">
                {hasStripeAccount ? "Your Stripe Account" : "Connect Your Stripe Account"}
              </h3>
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

              {hasStripeAccount ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">Your Stripe account is connected</span>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={async () => {
                        "use server";
                        // This would be implemented in a client component
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Update Account Details
                    </button>
                    <button
                      onClick={async () => {
                        "use server";
                        // This would be implemented in a client component
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      View Payout History
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ConnectStripeButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Stripe Connect FAQ</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">What is Stripe Connect?</h3>
              <p className="text-gray-600">
                Stripe Connect is a payment platform that allows Jackerbox to securely transfer rental payments to equipment owners. It handles all the payment processing, identity verification, and compliance requirements.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Is there a fee for using Stripe Connect?</h3>
              <p className="text-gray-600">
                Jackerbox covers the Stripe Connect platform fees. However, standard payment processing fees apply to each transaction, which is typically 2.9% + $0.30 per successful charge.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">How long does it take to receive payouts?</h3>
              <p className="text-gray-600">
                Once a rental is completed, funds are typically available in your connected bank account within 2-3 business days, depending on your bank's processing times.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What information do I need to provide?</h3>
              <p className="text-gray-600">
                To comply with financial regulations, you'll need to provide basic personal information, banking details, and in some cases, verification documents like a government-issued ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 