import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { toggleDebugMode, getDebugMode } from '@/lib/sse/sse-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ debugMode: getDebugMode() });
}
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = await req.json().catch(() => null);
  if (!data || typeof data.enabled !== 'boolean') return NextResponse.json({ error: 'Boolean enabled required' }, { status: 400 });
  return NextResponse.json({ debugMode: toggleDebugMode(data.enabled) });
}
