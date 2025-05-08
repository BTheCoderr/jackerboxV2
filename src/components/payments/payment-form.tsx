"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
  AddressElement,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { formatAmountFromStripe } from "@/lib/stripe";
import { Loader2, CreditCard, Shield, Info } from "lucide-react";
import { apiClient } from "@/lib/utils/api-client";

interface PaymentFormProps {
  rentalId: string;
  paymentId: string;
  amount: number;
  securityDeposit?: number;
  currency?: string;
  equipmentTitle?: string;
  startDate?: string;
  endDate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentFormWrapper({
  rentalId,
  paymentId,
  amount,
  securityDeposit,
  currency = "USD",
  equipmentTitle,
  startDate,
  endDate,
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
        const response = await apiClient.post("/api/payments/create-intent", {
          rentalId,
          paymentId,
          amount,
          securityDeposit,
          currency,
        });

        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }
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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jacker-blue mb-4"></div>
          <p className="text-gray-600">Setting up your payment...</p>
        </div>
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
            securityDeposit={securityDeposit}
            currency={currency}
            equipmentTitle={equipmentTitle}
            startDate={startDate}
            endDate={endDate}
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
  securityDeposit?: number;
  currency: string;
  equipmentTitle?: string;
  startDate?: string;
  endDate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function PaymentForm({
  clientSecret,
  amount,
  securityDeposit,
  currency,
  equipmentTitle,
  startDate,
  endDate,
  onSuccess,
  onCancel,
}: InnerPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");

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
          payment_method_data: {
            billing_details: {
              // You can add additional billing details here if needed
            },
          },
          // Save payment method for future use if this is a security deposit
          setup_future_usage: securityDeposit ? "off_session" : undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment");
        console.error("Payment error:", error);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/routes/rentals/payment-success");
        }
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // Handle 3D Secure authentication
        toast.info("Additional authentication required. Please complete the authentication process.");
        const { error } = await stripe.confirmPayment({
          clientSecret,
          redirect: "if_required",
        });
        
        if (error) {
          setErrorMessage(error.message || "Authentication failed");
        } else {
          toast.success("Payment successful!");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/routes/rentals/payment-success");
          }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Complete your payment</h2>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium mb-2">Order Summary</h3>
          
          {equipmentTitle && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Item:</span> {equipmentTitle}
            </div>
          )}
          
          {startDate && endDate && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Rental Period:</span> {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          )}
          
          <div className="flex justify-between text-sm mb-1">
            <span>Rental Fee:</span>
            <span>{formatCurrency(amount - (securityDeposit || 0), currency)}</span>
          </div>
          
          {securityDeposit && securityDeposit > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center">
                Security Deposit <Info className="h-3 w-3 ml-1 text-gray-400" title="Refundable after rental completion" />
              </span>
              <span>{formatCurrency(securityDeposit, currency)}</span>
            </div>
          )}
          
          <div className="border-t border-gray-200 my-2"></div>
          
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(amount, currency)}</span>
          </div>
        </div>
        
        {securityDeposit && securityDeposit > 0 && (
          <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700 flex items-start">
            <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <p>
              A security deposit of {formatCurrency(securityDeposit, currency)} will be held and 
              automatically refunded after the rental is completed successfully.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4">
          <div className="flex mb-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center px-4 py-2 ${
                paymentMethod === "card"
                  ? "border-b-2 border-jacker-blue text-jacker-blue"
                  : "text-gray-500"
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Credit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bank")}
              className={`flex items-center px-4 py-2 ${
                paymentMethod === "bank"
                  ? "border-b-2 border-jacker-blue text-jacker-blue"
                  : "text-gray-500"
              }`}
            >
              Bank Account
            </button>
          </div>
          
          <PaymentElement />
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Billing Address</h3>
          <AddressElement options={{
            mode: 'billing',
            fields: {
              phone: 'always',
            },
            validation: {
              phone: {
                required: 'always',
              },
            },
          }} />
        </div>

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
              `Pay ${formatCurrency(amount, currency)}`
            )}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 flex items-center justify-center">
          <Shield className="h-3 w-3 mr-1" />
          <span>Secure payment processed by Stripe</span>
        </div>
      </form>
    </div>
  );
}