export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ConnectStripeButton } from "@/components/stripe/connect-stripe-button";
import { StripeConnectSetup } from "@/components/dashboard/stripe-connect-setup";

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

export default async function StripeConnectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard/stripe-connect");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stripe Connect Setup</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Connect Your Stripe Account</h2>
        <StripeConnectSetup user={user} />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Stripe Connect FAQ</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">What is Stripe Connect?</h3>
            <p className="text-gray-600 mt-1">
              Stripe Connect is a payment platform that allows Jackerbox to securely transfer rental payments to
              equipment owners. It handles all the payment processing, identity verification, and compliance
              requirements.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Is there a fee for using Stripe Connect?</h3>
            <p className="text-gray-600 mt-1">
              Jackerbox covers the Stripe Connect platform fees. However, standard payment processing fees
              (typically 2.9% + $0.30 per transaction) will be deducted from your rental earnings.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">How long does it take to receive payments?</h3>
            <p className="text-gray-600 mt-1">
              Once a rental is completed, funds are typically available in your connected bank account within
              2-3 business days, depending on your bank's processing time.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">What information do I need to provide?</h3>
            <p className="text-gray-600 mt-1">
              Stripe requires standard business information for compliance and tax purposes. This may include
              your legal name, address, tax ID, and banking details. All information is securely handled by
              Stripe's platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 