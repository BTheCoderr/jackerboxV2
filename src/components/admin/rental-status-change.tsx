"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Target = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export function RentalStatusChange({ rentalId, currentStatus }: { rentalId: string; currentStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const options: { label: string; value: Target }[] =
    currentStatus === 'PENDING' ? [{ label: 'Cancel unpaid request', value: 'CANCELLED' }] :
    currentStatus === 'PAID' ? [{ label: 'Start rental', value: 'ACTIVE' }] :
    currentStatus === 'ACTIVE' ? [{ label: 'Mark completed', value: 'COMPLETED' }] : [];

  const submit = async (status: Target) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || 'Unable to update rental');
      toast.success('Rental status updated');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update rental');
    } finally {
      setBusy(false);
    }
  };
  if (!options.length) return <p className="text-sm text-gray-500">No status changes available.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button key={option.value} type="button" disabled={busy}
          onClick={() => submit(option.value)}
          className="rounded bg-jacker-blue px-4 py-2 text-white disabled:opacity-50">
          {busy ? 'Updating…' : option.label}
        </button>
      ))}
    </div>
  );
}
