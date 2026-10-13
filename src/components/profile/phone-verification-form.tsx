"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PhoneVerificationFormProps {
  user: { id: string; phone: string | null; phoneVerified: boolean };
  onVerificationComplete?: () => void;
}
export function PhoneVerificationForm({ user, onVerificationComplete }: PhoneVerificationFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(user.phone ?? '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent, method: 'POST' | 'PUT') => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'POST' ? { phone } : { phone, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Phone verification failed');
      if (method === 'POST') {
        setSent(true);
        setMessage('Code sent. It expires in 10 minutes.');
      } else {
        setMessage('Phone verified successfully');
        onVerificationComplete?.();
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Phone verification unavailable');
    } finally {
      setBusy(false);
    }
  };

  if (user.phoneVerified) return <p className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
    Phone verified: {user.phone}
  </p>;

  return <section className="space-y-4 rounded border p-5">
    <h2 className="font-semibold">Verify your phone</h2>
    <p className="text-sm text-gray-600">We will send a one-time SMS. Phone numbers must include the country code.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    {!sent ? <form onSubmit={e => submit(e, 'POST')} className="space-y-3">
      <label className="block text-sm">Phone number
        <input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+14015550100" required className="mt-1 w-full rounded border p-2" />
      </label>
      <Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send verification code'}</Button>
    </form> : <form onSubmit={e => submit(e, 'PUT')} className="space-y-3">
      <label className="block text-sm">Six-digit SMS code
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
          value={code} onChange={e => setCode(e.target.value)} required className="mt-1 w-full rounded border p-2" />
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : 'Verify code'}</Button>
        <Button type="button" variant="outline" onClick={() => { setSent(false); setCode(''); }}>Start over</Button>
      </div>
    </form>}
  </section>;
}
