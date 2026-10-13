import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Next.js route handlers running on Netlify cannot host a Socket.IO server.
// Previously unauthenticated callers could write arbitrary events to Redis.
// Keep this endpoint non-operational until a dedicated authenticated realtime
// service or the existing authorized SSE channel fully replaces it.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Socket transport unavailable; use SSE' }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({ error: 'Direct socket event publishing is disabled' }, { status: 403 });
}
