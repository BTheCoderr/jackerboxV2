import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';

// Legacy endpoint returned fake example.com URLs. No upload is successful unless
// storage actually acknowledges it. Photo uploads use /api/upload/images.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    message: 'This legacy upload endpoint is disabled; use the equipment photo uploader.',
  }, { status: 501 });
}
