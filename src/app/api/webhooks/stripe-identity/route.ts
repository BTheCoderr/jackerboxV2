import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { message: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object;
      
      // Get the user ID from the metadata
      const userId = session.metadata?.userId;
      
      if (!userId) {
        console.error("No user ID found in verification session metadata");
        return NextResponse.json(
          { message: "No user ID found in verification session metadata" },
          { status: 400 }
        );
      }
      
      // Update the user record to mark ID as verified
      await db.user.update({
        where: { id: userId },
        data: {
          idVerified: true,
          idVerificationStatus: "approved",
          idVerificationDate: new Date(),
        } as any, // Use type assertion to avoid TypeScript errors
      });
      
      console.log(`User ${userId} ID verified successfully`);
    } else if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      
      if (userId) {
        // Update the user record to indicate additional information is needed
        await db.user.update({
          where: { id: userId },
          data: {
            idVerificationStatus: "requires_input",
          } as any, // Use type assertion to avoid TypeScript errors
        });
        
        console.log(`User ${userId} ID verification requires additional input`);
      }
    } else if (event.type === "identity.verification_session.canceled") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      
      if (userId) {
        // Update the user record to indicate verification was canceled
        await db.user.update({
          where: { id: userId },
          data: {
            idVerificationStatus: "canceled",
          } as any, // Use type assertion to avoid TypeScript errors
        });
        
        console.log(`User ${userId} ID verification was canceled`);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 500 }
    );
  }
} 