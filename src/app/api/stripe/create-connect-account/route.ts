import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    // Get the current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user already has a Stripe Connect account
    if (currentUser.stripeConnectAccountId) {
      // Get the account link for an existing account
      const accountLink = await stripe.accountLinks.create({
        account: currentUser.stripeConnectAccountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?error=true`,
        return_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?success=true`,
        type: 'account_onboarding',
      });

      return NextResponse.json({ url: accountLink.url });
    }

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: process.env.STRIPE_ACCOUNT_COUNTRY || 'US',
      email: currentUser.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: currentUser.id,
      },
    });

    // Update the user with the Stripe Connect account ID
    await db.user.update({
      where: { id: currentUser.id },
      data: { stripeConnectAccountId: account.id },
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?error=true`,
      return_url: `${process.env.NEXTAUTH_URL}/routes/dashboard/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return new NextResponse('Error creating Stripe Connect account', { status: 500 });
  }
} 