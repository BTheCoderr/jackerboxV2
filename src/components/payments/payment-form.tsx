"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { formatAmountFromStripe } from "@/lib/stripe";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  rentalId: string;
  paymentId: string;
  amount: number;
  securityDeposit?: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentFormWrapper({
  rentalId,
  paymentId,
  amount,
  securityDeposit,
  currency = "USD",
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rentalId,
            paymentId,
            amount,
            securityDeposit,
            currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while setting up the payment"
        );
        if (onCancel) {
          onCancel();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [rentalId, paymentId, amount, securityDeposit, currency, onCancel]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jacker-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">
          Unable to initialize payment. Please try again later.
        </p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <div className="w-full max-w-md mx-auto">
      {stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  );
}

interface InnerPaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function PaymentForm({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onCancel,
}: InnerPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/routes/rentals/payment-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/routes/rentals/payment-success");
        }
      } else {
        setErrorMessage("Payment status unknown. Please contact support.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Complete your payment</h2>
        <p className="text-gray-600">
          Total amount: {formatCurrency(amount, currency)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !stripe || !elements}
            className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 flex-1 flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              "Pay now"
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 