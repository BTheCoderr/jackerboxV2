'use client';

import { useState, useEffect } from 'react';
import { TestPaymentFormWrapper } from '@/components/payments/test-payment-form';

// Debug component to check environment variables
function DebugInfo() {
  const [envInfo, setEnvInfo] = useState<string>('');
  const [stripeLoadError, setStripeLoadError] = useState<string>('');

  useEffect(() => {
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    setEnvInfo(stripeKey ? `Stripe key found: ${stripeKey.substring(0, 12)}... (length: ${stripeKey.length})` : 'Stripe key NOT found');
    
    // Test Stripe loading
    if (stripeKey) {
      import('@/lib/stripe-client').then(({ getStripe }) => {
        getStripe()?.then(stripe => {
          if (stripe) {
            setStripeLoadError('✅ Stripe loaded successfully');
          } else {
            setStripeLoadError('❌ Stripe failed to load (returned null)');
          }
        }).catch(error => {
          setStripeLoadError(`❌ Stripe load error: ${error.message}`);
        });
      });
    }
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-4">
      <h3 className="font-bold text-blue-800">Debug Info:</h3>
      <p className="text-blue-700">{envInfo}</p>
      <p className="text-blue-700">{stripeLoadError}</p>
      <p className="text-xs text-blue-600">Check browser console for detailed logs</p>
    </div>
  );
}

export default function TestStripePage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testWebhook = async (eventType: string) => {
    setIsLoading(true);
    addTestResult(`Testing ${eventType} webhook...`);
    
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType }),
      });

      if (response.ok) {
        const result = await response.json();
        addTestResult(`✅ ${eventType} webhook test successful: ${result.message}`);
      } else {
        const error = await response.text();
        addTestResult(`❌ ${eventType} webhook test failed: ${error}`);
      }
    } catch (error) {
      addTestResult(`❌ ${eventType} webhook test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestPayment = async () => {
    setIsLoading(true);
    addTestResult('Creating test payment intent...');
    
    try {
      const response = await fetch('/api/create-test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        addTestResult(`✅ Test payment created: ${result.paymentIntentId}`);
      } else {
        const error = await response.text();
        addTestResult(`❌ Failed to create test payment: ${error}`);
      }
    } catch (error) {
      addTestResult(`❌ Error creating test payment: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <DebugInfo />
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Test Mode Active:</strong> You're using Stripe test keys. No real charges will be made.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h1 className="text-3xl font-bold mb-6">Stripe Integration Test Suite</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Payment Form Test */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Payment Form Test</h2>
            <TestPaymentFormWrapper 
              amount={2000} // $20.00
              securityDeposit={500} // $5.00
              currency="USD"
              onSuccess={() => addTestResult('✅ Payment form completed successfully!')}
              onCancel={() => addTestResult('⚠️ Payment form cancelled')}
            />
          </div>

          {/* Webhook Tests */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Webhook Tests</h2>
            <div className="space-y-3">
              <button
                onClick={createTestPayment}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Test Payment Intent
              </button>
              
              <button
                onClick={() => testWebhook('payment_intent.succeeded')}
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Test Payment Success Webhook
              </button>
              
              <button
                onClick={() => testWebhook('payment_intent.payment_failed')}
                disabled={isLoading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Test Payment Failed Webhook
              </button>
              
              <button
                onClick={() => testWebhook('identity.verification_session.verified')}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Test Identity Verification Webhook
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Test Results */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet...</p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm font-mono ${
                  result.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : result.includes('❌')
                    ? 'bg-red-100 text-red-800'
                    : result.includes('⚠️')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
        {testResults.length > 0 && (
          <button
            onClick={() => setTestResults([])}
            className="mt-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Results
          </button>
        )}
      </section>

      {/* Stripe CLI Information */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Stripe CLI Testing</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">1. Install Stripe CLI:</h3>
            <code className="bg-gray-200 p-2 rounded block">
              brew install stripe/stripe-cli/stripe
            </code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Login to Stripe:</h3>
            <code className="bg-gray-200 p-2 rounded block">
              stripe login
            </code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Forward webhooks to local development:</h3>
            <code className="bg-gray-200 p-2 rounded block">
              stripe listen --forward-to localhost:3001/api/webhooks/stripe
            </code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">4. Test specific events:</h3>
            <code className="bg-gray-200 p-2 rounded block">
              stripe trigger payment_intent.succeeded
            </code>
          </div>
        </div>
      </section>

      {/* Current Webhook Configuration */}
      <section className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Webhook Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Webhook URL:</strong>
            <br />
            <code className="text-xs">https://jackerbox-ej0ntneyf-be-forreals-projects.vercel.app/api/webhooks/stripe</code>
          </div>
          <div>
            <strong>Webhook Secret:</strong>
            <br />
            <code className="text-xs">whsec_kTJDU6ECx...wzwE</code>
          </div>
          <div>
            <strong>Events Listening To:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>payment_intent.succeeded</li>
              <li>payment_intent.payment_failed</li>
              <li>charge.refunded</li>
              <li>identity.verification_session.verified</li>
            </ul>
          </div>
          <div>
            <strong>API Version:</strong>
            <br />
            <code>2025-01-27.acacia</code>
          </div>
        </div>
      </section>
    </div>
  );
} 