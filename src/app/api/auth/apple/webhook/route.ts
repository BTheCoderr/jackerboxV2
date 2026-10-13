import { NextResponse } from 'next/server';

// Apple server-to-server messages must be cryptographically verified against Apple's
// current signing keys before changing any linked account or personal data.
// Never trust an unauthenticated JSON body for deletion or verification.
export async function POST() {
  return NextResponse.json({
    error: 'Apple notification processing is not configured',
  }, { status: 501 });
}
