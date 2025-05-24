"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { Loader2 } from "lucide-react";

interface TestPaymentFormProps {
  amount?: number;
  securityDeposit?: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TestPaymentFormWrapper({
  amount = 2000,
  securityDeposit = 500,
  currency = "USD",
  onSuccess,
  onCancel,
}: TestPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/payments/test-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            securityDeposit,
            currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create payment intent");
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
  }, [amount, securityDeposit, currency, onCancel]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <TestPaymentForm
            clientSecret={clientSecret}
            amount={amount}
            securityDeposit={securityDeposit}
            currency={currency}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  );
}

interface InnerTestPaymentFormProps {
  clientSecret: string;
  amount: number;
  securityDeposit?: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function TestPaymentForm({
  clientSecret,
  amount,
  securityDeposit,
  currency,
  onSuccess,
  onCancel,
}: InnerTestPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/test-stripe`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage("Payment status unknown. Please contact support.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const totalAmount = amount + (securityDeposit || 0);

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Test Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Rental Amount:</span>
            <span>{formatCurrency(amount, currency)}</span>
          </div>
          {securityDeposit && (
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span>{formatCurrency(securityDeposit, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(totalAmount, currency)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            🧪 Test Mode: Use card number <code>4242424242424242</code> for success
          </p>
        </div>
        
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
        
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(totalAmount, currency)}`
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 