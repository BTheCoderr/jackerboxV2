import { NextRequest, NextResponse } from 'next/server';
import { publish } from '@/lib/sse/sse-manager';
import { getCurrentUser } from '@/lib/auth/auth-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Publish a message to a topic
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { topic, data } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    const recipientCount = publish(topic, data);
    
    return NextResponse.json({
      success: true,
      topic,
      recipientCount,
    });
  } catch (error) {
    console.error('Error publishing SSE message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 