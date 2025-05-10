'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const TEST_CARDS = [
  {
    name: 'Successful payment',
    number: '4242 4242 4242 4242',
    description: 'Always succeeds'
  },
  {
    name: 'Requires authentication',
    number: '4000 0025 0000 3155',
    description: 'Requires 3D Secure authentication'
  },
  {
    name: 'Declined payment',
    number: '4000 0000 0000 9995',
    description: 'Always fails with decline'
  },
  {
    name: 'Insufficient funds',
    number: '4000 0000 0000 9995',
    description: 'Fails with insufficient_funds error'
  },
  {
    name: 'Lost card',
    number: '4000 0000 0000 9987',
    description: 'Fails with lost_card error'
  },
  {
    name: 'Expired card',
    number: '4000 0000 0000 0069',
    description: 'Fails with expired_card error'
  }
];

declare global {
  interface Window {
    gtag: (command: string, action: string, params: any) => void;
  }
}

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const trackEvent = (action: string, params: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, params);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);

    try {
      trackEvent('payment_attempt', {
        category: 'Payment',
      });

      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setDebugInfo({
          type: submitError.type,
          code: submitError.code,
          decline_code: submitError.decline_code,
          param: submitError.param
        });

        trackEvent('payment_error', {
          category: 'Payment',
          error_type: submitError.type,
          error_code: submitError.code,
        });
      } else if (paymentIntent) {
        setSuccess(`Payment successful! ID: ${paymentIntent.id}`);
        setDebugInfo(paymentIntent);

        trackEvent('payment_success', {
          category: 'Payment',
          payment_id: paymentIntent.id,
          amount: paymentIntent.amount,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setDebugInfo(err);

      trackEvent('payment_error', {
        category: 'Payment',
        error_type: 'unexpected',
        error_message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {debugInfo && (
        <Card className="p-4 mt-4">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Card>
      )}
    </form>
  );
};

const WebhookTester = () => {
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testWebhook = async (event: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });
      const result = await response.json();
      setWebhookLogs(prev => [...prev, { event, result, timestamp: new Date() }]);
    } catch (error: any) {
      setWebhookLogs(prev => [...prev, { 
        event, 
        error: error.message, 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={() => testWebhook('payment_intent.succeeded')}
          disabled={loading}
        >
          Test Success
        </Button>
        <Button 
          onClick={() => testWebhook('payment_intent.payment_failed')}
          disabled={loading}
        >
          Test Failure
        </Button>
        <Button 
          onClick={() => testWebhook('charge.refunded')}
          disabled={loading}
        >
          Test Refund
        </Button>
      </div>
      <Card className="p-4">
        <h3 className="font-bold mb-2">Webhook Logs</h3>
        <div className="space-y-2">
          {webhookLogs.map((log, i) => (
            <div key={i} className="border p-2 rounded">
              <div className="font-semibold">{log.event}</div>
              <div className="text-sm text-gray-500">
                {log.timestamp.toLocaleString()}
              </div>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(log.result || log.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const TestCards = () => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {TEST_CARDS.map(card => (
      <Card key={card.number} className="p-4">
        <h3 className="font-bold">{card.name}</h3>
        <div className="text-sm text-gray-500 mt-1">{card.description}</div>
        <div className="font-mono mt-2">{card.number}</div>
        <div className="text-sm mt-2">
          <div>Expiry: Any future date</div>
          <div>CVC: Any 3 digits</div>
          <div>ZIP: Any 5 digits</div>
        </div>
      </Card>
    ))}
  </div>
);

export default function TestPaymentFlow() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Payment Testing Dashboard</h1>
      
      <Tabs defaultValue="payment">
        <TabsList>
          <TabsTrigger value="payment">Payment Form</TabsTrigger>
          <TabsTrigger value="cards">Test Cards</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Test Payment</h2>
            <Elements stripe={stripePromise}>
              <PaymentForm />
            </Elements>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <h2 className="text-xl font-bold mb-4">Test Cards</h2>
          <TestCards />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <h2 className="text-xl font-bold mb-4">Webhook Testing</h2>
          <WebhookTester />
        </TabsContent>
      </Tabs>
    </div>
  );
} 