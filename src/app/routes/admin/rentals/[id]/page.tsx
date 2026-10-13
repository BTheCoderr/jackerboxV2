export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { RentalStatusChange } from '@/components/admin/rental-status-change';
import { RefundSecurityDepositButton } from '@/components/admin/refund-security-deposit-button';

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const date = (d: Date) => new Date(d).toLocaleDateString('en-US');

export default async function AdminRentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) redirect('/');

  const { id } = await params;
  const rental = await db.rental.findUnique({
    where: { id },
    include: {
      equipment: { include: { owner: { select: { id: true, name: true, email: true } } } },
      renter: { select: { id: true, name: true, email: true, idVerified: true } },
      payment: true,
    },
  });
  if (!rental) notFound();

  const paymentStatus = rental.payment?.status ?? 'NOT_STARTED';
  const chargedAmount = rental.totalPrice + (rental.securityDeposit ?? 0);
  const canRefundDeposit = rental.status === 'COMPLETED' &&
    paymentStatus === 'COMPLETED' && (rental.securityDeposit ?? 0) > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Link href="/routes/admin/rentals" className="text-jacker-blue hover:underline">← Back to rentals</Link>
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-semibold">Rental details</h1>
          <p className="text-sm text-gray-500 break-all">{rental.id}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">{rental.status}</span>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold">Equipment and schedule</h2>
          <p><Link className="text-jacker-blue hover:underline" href={`/routes/admin/equipment/${rental.equipment.id}`}>{rental.equipment.title}</Link></p>
          <p>Starts: {date(rental.startDate)}</p>
          <p>Ends: {date(rental.endDate)}</p>
          <p>Owner: {rental.equipment.owner.name || rental.equipment.owner.email}</p>
          <p>Renter: {rental.renter.name || rental.renter.email}</p>
          <p className="text-sm text-gray-600">Renter verification: {rental.renter.idVerified ? 'Verified' : 'Not verified'}</p>
          <p className="text-xs text-gray-500">Created {date(rental.createdAt)}</p>
        </section>
        <section className="rounded-lg border bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold">Payment</h2>
          <div className="flex justify-between"><span>Rental price</span><span>{usd(rental.totalPrice)}</span></div>
          <div className="flex justify-between"><span>Security deposit</span><span>{usd(rental.securityDeposit ?? 0)}</span></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Checkout total</span><span>{usd(chargedAmount)}</span></div>
          <p>Status: {paymentStatus}</p>
          <p className="break-all text-xs text-gray-500">Stripe intent: {rental.payment?.stripePaymentIntentId || 'None'}</p>
          {canRefundDeposit && (
            <RefundSecurityDepositButton rentalId={rental.id} securityDepositAmount={rental.securityDeposit!} />
          )}
        </section>
      </div>
      <section className="rounded-lg border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Admin rental actions</h2>
        <RentalStatusChange rentalId={rental.id} currentStatus={rental.status} />
        <p className="text-xs text-gray-600">
          Changes are restricted to valid transitions. Paid cancellations and charge disputes require reviewed refund handling.
        </p>
      </section>
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Contact participants</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link className="text-jacker-blue hover:underline" href={`/routes/messages/${rental.renterId}`}>Message renter</Link>
          <Link className="text-jacker-blue hover:underline" href={`/routes/messages/${rental.equipment.ownerId}`}>Message owner</Link>
        </div>
      </section>
    </main>
  );
}
