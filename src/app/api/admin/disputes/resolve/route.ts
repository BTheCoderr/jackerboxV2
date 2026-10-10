import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';

// Disputes need a persisted case model, an audit trail and Stripe refund confirmation.
// The legacy handler referenced tables that do not exist. Never report success here.
export async function POST() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return NextResponse.json({
    message: 'Dispute resolution is unavailable until the case ledger and payment workflow are enabled.',
  }, { status: 501 });
}
