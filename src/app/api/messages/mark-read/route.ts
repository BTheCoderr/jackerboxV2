import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';

// Read receipts are not persisted in the current Prisma schema.
// Never claim to have changed message records that do not have an isRead field.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ message: 'Read receipts require a database migration' }, { status: 501 });
}
