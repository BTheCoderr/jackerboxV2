export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { Prisma, PaymentStatus } from '@/lib/prisma-client';
import { ProcessPayoutButton } from '@/components/admin/process-payout-button';
import { RefundSecurityDepositButton } from '@/components/admin/refund-security-deposit-button';

const usd = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(value);

function recorded(metadata: unknown, key: string): boolean {
  return !!(metadata && typeof metadata === 'object' &&
    !Array.isArray(metadata) && (metadata as Record<string, unknown>)[key]);
}

export default async function AdminPaymentsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/');

  const params = await searchParams;
  const selected = (params.status || 'all').toUpperCase();
  const page = Math.max(1, Math.min(1000, parseInt(params.page || '1', 10) || 1));
  const limit = 10;
  const valid = Object.values(PaymentStatus).includes(selected as PaymentStatus);
  const where: Prisma.PaymentWhereInput = valid ? { status: selected as PaymentStatus } : {};

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        rental: { include: { equipment: { select: { id: true, title: true } } } },
      },
    }),
    db.payment.count({ where }),
  ]);
  const pages = Math.ceil(total / limit);
  const filter = valid ? selected.toLowerCase() : 'all';

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payment Management</h1>
        <Link href="/routes/admin" className="text-jacker-blue hover:underline">Back to dashboard</Link>
      </div>
      <nav className="flex flex-wrap gap-2">
        {['all', ...Object.values(PaymentStatus).map(x => x.toLowerCase())].map(option => (
          <Link key={option} href={`/routes/admin/payments?status=${option}`}
            className={`rounded px-3 py-2 text-sm ${filter === option ? 'bg-jacker-blue text-white' : 'bg-gray-100 text-gray-800'}`}>
            {option.replaceAll('_', ' ')}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Payment</th>
              <th className="p-3">Rental</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payout</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map(payment => {
              const rental = payment.rental;
              const paidOut = recorded(payment.metadata, 'ownerPayoutTransferId');
              const depositReturned = recorded(payment.metadata, 'securityDepositRefundId');
              const completed = payment.status === 'COMPLETED' && rental?.status === 'COMPLETED';
              return (
                <tr key={payment.id}>
                  <td className="p-3 text-gray-500">
                    <span className="font-mono">{payment.id.slice(0, 8)}</span>
                    <p className="text-xs">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-3">
                    {rental ? <Link className="text-jacker-blue hover:underline"
                      href={`/routes/rentals/${rental.id}`}>{rental.equipment.title}</Link> :
                      <span className="text-gray-500">Unlinked</span>}
                  </td>
                  <td className="p-3">{payment.user.name || payment.user.email}</td>
                  <td className="p-3">{usd(payment.amount)}</td>
                  <td className="p-3">{payment.status}</td>
                  <td className="p-3">{payment.status === 'COMPLETED' ?
                    (paidOut ? 'Transferred' : 'Not transferred') : 'N/A'}</td>
                  <td className="p-3 space-y-2">
                    {completed && rental && !paidOut && <ProcessPayoutButton rentalId={rental.id} />}
                    {completed && rental && (rental.securityDeposit ?? 0) > 0 && !depositReturned && (
                      <RefundSecurityDepositButton rentalId={rental.id}
                        securityDepositAmount={rental.securityDeposit ?? 0} />
                    )}
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No matching payments</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-gray-500">Page {page} of {pages} • {total} payments</p>
        <div className="flex gap-3">
          {page > 1 && <Link href={`/routes/admin/payments?status=${filter}&page=${page - 1}`}>Previous</Link>}
          {page < pages && <Link href={`/routes/admin/payments?status=${filter}&page=${page + 1}`}>Next</Link>}
        </div>
      </div>}
    </main>
  );
}
