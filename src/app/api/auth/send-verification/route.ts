import { NextResponse } from 'next/server';
// Phone-only sign-in is disabled. These endpoints must not provide reusable,
// unverifiable codes that could be mistaken for authenticated sessions.
export async function POST() {
  return NextResponse.json({ message: 'Phone-only login is unavailable; use email or Google' }, { status: 410 });
}
