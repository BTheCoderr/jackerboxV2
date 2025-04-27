'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Helper function for API calls
const callPaymentTestApi = async (action: string, paymentIntentId: string) => {
  const response = await fetch('/api/payments/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, paymentIntentId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ${action} payment`);
  }
  
  return await response.json();
};

// CheckoutForm component
function CheckoutForm({ clientSecret, paymentIntentId }: { clientSecret: string, paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/admin/payment-test?status=success',
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'Payment Failed');
    } else {
      setMessage('Payment processed successfully!');
      toast.success('Your payment was processed successfully');
      
      // Simulate success on the backend
      try {
        const data = await callPaymentTestApi('simulate-success', paymentIntentId);
        console.log('Success simulated:', data);
      } catch (err) {
        console.error('Error simulating success:', err);
      }
    }

    setIsLoading(false);
  };

  const handleRefund = async () => {
    try {
      const data = await callPaymentTestApi('refund', paymentIntentId);
      setMessage('Payment refunded successfully!');
      toast.success('Your payment was refunded successfully');
      console.log('Refund processed:', data);
    } catch (err) {
      console.error('Error processing refund:', err);
      setMessage('Failed to process refund');
      toast.error('There was an error processing the refund');
    }
  };

  const handleSimulateFailure = async () => {
    try {
      const data = await callPaymentTestApi('simulate-failure', paymentIntentId);
      setMessage('Payment failure simulated successfully!');
      toast.success('Payment failure was simulated');
      console.log('Failure simulated:', data);
    } catch (err) {
      console.error('Error simulating failure:', err);
      setMessage('Failed to simulate failure');
      toast.error('There was an error simulating payment failure');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="space-y-2">
        {message && (
          <div className="bg-slate-100 p-3 rounded text-sm">{message}</div>
        )}
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Button>
        
        <div className="flex gap-2 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSimulateFailure}
            className="flex-1"
          >
            Simulate Failure
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleRefund}
            className="flex-1"
          >
            Process Refund
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function PaymentTestPage() {
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    payment: any;
  } | null>(null);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          amount: parseFloat(amount) * 100, // Convert to cents
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setPaymentIntent({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        payment: data.payment,
      });
      
      toast.success('Payment Intent Created');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to create payment intent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Test</CardTitle>
          <CardDescription>
            Test payment processing with Stripe integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!paymentIntent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <Button onClick={createPaymentIntent} disabled={loading}>
                {loading ? 'Creating...' : 'Create Payment Intent'}
              </Button>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
              <CheckoutForm 
                clientSecret={paymentIntent.clientSecret}
                paymentIntentId={paymentIntent.paymentIntentId}
              />
            </Elements>
          )}

          {/* Payment details section */}
          {paymentIntent?.payment && (
            <div className="mt-8">
              <hr className="my-4" />
              <h3 className="font-medium mb-2">Payment Intent Details</h3>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(paymentIntent.payment, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 