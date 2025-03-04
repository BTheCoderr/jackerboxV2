import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

async function main() {
  try {
    // Get the email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.error('Please provide an email address as an argument');
      console.error('Usage: npm run setup-stripe-connect user@example.com');
      process.exit(1);
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Check if the user already has a Stripe Connect account
    if (user.stripeConnectAccountId) {
      console.log(`User already has a Stripe Connect account: ${user.stripeConnectAccountId}`);
      
      // Retrieve the account to check its status
      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
      console.log(`Account status: ${account.details_submitted ? 'Details submitted' : 'Details not submitted'}`);
      console.log(`Account capabilities:`, account.capabilities);
      
      process.exit(0);
    }

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: process.env.STRIPE_ACCOUNT_COUNTRY || 'US',
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        url: 'https://jackerbox.com',
      },
    });

    // Update the user with the new Stripe Connect account ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectAccountId: account.id },
    });

    console.log(`Created Stripe Connect account for ${email}: ${account.id}`);
    
    // Generate an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://jackerbox.com/stripe/refresh',
      return_url: 'https://jackerbox.com/stripe/return',
      type: 'account_onboarding',
    });

    console.log(`Onboarding URL: ${accountLink.url}`);
    console.log('Send this URL to the user to complete their Stripe Connect onboarding');
    
  } catch (error) {
    console.error('Error setting up Stripe Connect account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 