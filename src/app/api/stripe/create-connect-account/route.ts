import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    // Create a Stripe Connect account link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeConnectAccountId || await createConnectAccount(stripe, user.id),
      refresh_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?error=true`,
      return_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}

async function createConnectAccount(stripe: Stripe, userId: string) {
  try {
    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: process.env.STRIPE_ACCOUNT_COUNTRY || 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId,
      },
    });

    // Update the user with the Stripe Connect account ID
    const prisma = (await import('@/lib/db')).db;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeConnectAccountId: account.id },
    });

    return account.id;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
} 