import { NextRequest, NextResponse } from 'next/server';
import { POST as sendMessage } from '../route';

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data) return NextResponse.json({ message: 'Invalid message request' }, { status: 400 });
  const adapted = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({
      equipmentId: data.equipmentId,
      recipientId: data.recipientId,
      content: data.message,
    }),
  });
  return sendMessage(adapted);
}
export const dynamic = 'force-dynamic';
