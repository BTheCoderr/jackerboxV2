'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

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
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMessage('Payment processed successfully!');
      toast({
        title: 'Payment Successful',
        description: 'Your payment was processed successfully',
      });
      
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
      toast({
        title: 'Refund Processed',
        description: 'Your payment was refunded successfully',
      });
      console.log('Refund processed:', data);
    } catch (err) {
      console.error('Error processing refund:', err);
      setMessage('Failed to process refund');
      toast({
        title: 'Refund Failed',
        description: 'There was an error processing the refund',
        variant: 'destructive',
      });
    }
  };

  const handleSimulateFailure = async () => {
    try {
      const data = await callPaymentTestApi('simulate-failure', paymentIntentId);
      setMessage('Payment failure simulated successfully!');
      toast({
        title: 'Failure Simulated',
        description: 'Payment failure was simulated',
      });
      console.log('Failure simulated:', data);
    } catch (err) {
      console.error('Error simulating failure:', err);
      setMessage('Failed to simulate failure');
      toast({
        title: 'Simulation Failed',
        description: 'There was an error simulating payment failure',
        variant: 'destructive',
      });
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
  const { toast } = useToast();

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
      
      toast({
        title: 'Payment Intent Created',
        description: 'You can now test the payment process',
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payment intent',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Payment Service Test</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test the payment service with a real Stripe account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Payment Intent</CardTitle>
            <CardDescription>
              Create a new payment intent for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createPaymentIntent} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Payment Intent'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Payment</CardTitle>
            <CardDescription>
              Use the Stripe Elements to process the payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentIntent ? (
              <Elements 
                stripe={stripePromise} 
                options={{ clientSecret: paymentIntent.clientSecret }}
              >
                <CheckoutForm 
                  clientSecret={paymentIntent.clientSecret} 
                  paymentIntentId={paymentIntent.paymentIntentId} 
                />
              </Elements>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Create a payment intent first to enable the payment form
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {paymentIntent && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <Card>
            <CardContent className="pt-6">
              <pre className="bg-slate-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(paymentIntent.payment, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 