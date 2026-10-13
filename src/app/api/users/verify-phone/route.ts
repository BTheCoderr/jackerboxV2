import { NextResponse } from 'next/server';
// The old endpoint trusted a client-side Firebase result without validating
// its signed ID token on the server, enabling arbitrary self-verification.
// The authenticated OTP implementation lives at /api/auth/verify-phone.
export async function POST() {
  return NextResponse.json({ message: 'Use /api/auth/verify-phone to verify phone ownership' }, { status: 410 });
}
