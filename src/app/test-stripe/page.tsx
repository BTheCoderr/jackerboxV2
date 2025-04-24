'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/stripe-js';
import { PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function TestStripePage() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the client secret from our test endpoint
    fetch('/api/test-stripe')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClientSecret(data.paymentIntent.clientSecret);
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!clientSecret) return <div>No client secret available</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Stripe Integration</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <form className="space-y-4">
          <PaymentElement />
          <Button type="submit" className="w-full">
            Pay Now
          </Button>
        </form>
      </Elements>
    </div>
  );
} 