'use client';

import { useState } from 'react';
import { PaymentFormWrapper } from '@/components/payments/payment-form';

export default function TestStripePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Test Stripe Integration</h1>
      
      <PaymentFormWrapper 
        rentalId="test-rental-id"
        paymentId="test-payment-id"
        amount={2000} // $20.00
        securityDeposit={500} // $5.00
        currency="USD"
        onSuccess={() => alert('Payment successful!')}
        onCancel={() => alert('Payment cancelled')}
      />
    </div>
  );
} 