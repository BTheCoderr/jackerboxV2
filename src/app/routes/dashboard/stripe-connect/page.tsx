"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

export default function StripeConnectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL parameters for success or error
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");

    if (successParam === "true") {
      setSuccess(true);
    }

    if (errorParam === "true") {
      setError("There was an issue with your Stripe Connect onboarding. Please try again.");
    }
  }, [searchParams]);

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
        throw new Error(errorData.message || "Failed to create Stripe Connect account");
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
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Connect Setup</h1>
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your Stripe Connect account has been successfully set up. You can now receive payouts for your equipment rentals.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Stripe Account</CardTitle>
          <CardDescription>
            To receive payouts for your equipment rentals, you need to connect your Stripe account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Jackerbox uses Stripe Connect to securely transfer rental payments to equipment owners. 
            By connecting your Stripe account, you'll be able to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500 mb-4">
            <li>Receive automatic payouts for completed rentals</li>
            <li>Track your earnings in one place</li>
            <li>Manage your payout schedule and banking information</li>
          </ul>
          <p className="text-sm text-gray-500">
            Your information is securely handled by Stripe, and Jackerbox never stores your banking details.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleConnectStripe} 
            disabled={loading || success}
            className="w-full"
          >
            {loading ? "Processing..." : success ? "Connected" : "Connect with Stripe"}
            {!loading && !success && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 