import { NextResponse } from 'next/server';

// The former handler accepted unsigned inbound SMS and logged complete bodies,
// including one-time verification codes. Twilio/Telnyx signature verification and
// sender-aware processing are required before enabling inbound actions.
export async function POST() {
  return NextResponse.json(
    { message: 'Inbound SMS processing is not configured' },
    { status: 501 }
  );
}
