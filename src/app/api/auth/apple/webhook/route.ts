import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Log the notification for debugging
    console.log('Received Apple notification:', payload);

    // Handle different types of notifications
    switch (payload.type) {
      case 'email-disabled':
      case 'email-enabled':
        await prisma.user.update({
          where: {
            appleId: payload.sub
          },
          data: {
            emailVerified: payload.type === 'email-enabled'
          }
        });
        break;

      case 'consent-revoked':
        // Handle user revoking consent
        await prisma.account.deleteMany({
          where: {
            provider: 'apple',
            providerAccountId: payload.sub
          }
        });
        break;

      case 'account-delete':
        // Handle account deletion
        await prisma.user.delete({
          where: {
            appleId: payload.sub
          }
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Apple webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 