"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rental {
  id: string;
  status: string;
  payment?: { id: string; status: string } | null;
}

interface Props {
  rental: Rental;
  isOwner: boolean;
}

export function RentalActions({ rental, isOwner }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rentals/${rental.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Failed to change rental status');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update rental');
    } finally {
      setIsLoading(false);
    }
  }

  if (rental.status === 'COMPLETED' || rental.status === 'CANCELLED' || rental.status === 'REFUNDED') return null;

  const actions: { label: string; status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }[] = [];
  if (rental.status === 'PENDING') {
    if (!isOwner) actions.push({ label: 'Cancel unpaid request', status: 'CANCELLED' });
    if (isOwner) actions.push({ label: 'Decline unpaid request', status: 'CANCELLED' });
  }
  if (isOwner && rental.status === 'PAID' && rental.payment?.status === 'COMPLETED') {
    actions.push({ label: 'Start rental / hand over equipment', status: 'ACTIVE' });
  }
  if (isOwner && rental.status === 'ACTIVE') {
    actions.push({ label: 'Mark rental completed', status: 'COMPLETED' });
  }

  return (
    <div className="bg-white p-4 rounded-lg border space-y-3">
      <h3 className="font-medium">Rental actions</h3>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {rental.status === 'PENDING' && !isOwner && (
        <button type="button" onClick={() => router.push(`/routes/rentals/${rental.id}/payment`)}
          className="block w-full py-2 px-4 bg-jacker-blue text-white rounded-md">
          Pay for rental
        </button>
      )}
      {actions.map((action) => (
        <button key={action.status} type="button" onClick={() => updateStatus(action.status)} disabled={isLoading}
          className="block w-full py-2 px-4 border rounded-md disabled:opacity-50">
          {isLoading ? 'Working...' : action.label}
        </button>
      ))}
      {rental.status === 'PAID' && !isOwner && <p className="text-sm text-gray-600">Payment confirmed. Waiting for the owner to start the rental.</p>}
      {rental.status === 'ACTIVE' && !isOwner && <p className="text-sm text-gray-600">Rental active. Contact the owner if you need assistance.</p>}
    </div>
  );
}
