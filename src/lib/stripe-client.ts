"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.log("Stripe key check:", { 
      key: key ? `${key.substring(0, 10)}...` : 'undefined',
      keyLength: key?.length,
      keyValid: key?.startsWith('pk_test_') || key?.startsWith('pk_live_')
    });
    if (!key) {
      console.error("Stripe publishable key is not defined");
      return Promise.resolve(null);
    }
    console.log("Loading Stripe with key:", key.substring(0, 20) + "...");
    stripePromise = loadStripe(key).catch(error => {
      console.error("Failed to load Stripe:", error);
      return null;
    });
  }
  return stripePromise;
}; 