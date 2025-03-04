import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { sendNotification, NotificationType } from '@/lib/notifications/notification-service';

// Define explicit types for our custom fields
type PaymentUpdateData = {
  status?: string;
  stripePaymentIntentId?: string;
  securityDepositAmount?: number;
  rentalAmount?: number;
  securityDepositReturned?: boolean;
  disputeId?: string;
  updatedAt?: Date;
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Handle the event
  try {
    // Use a type to handle all event types, including custom ones
    const eventType = event.type as string;
    
    switch (eventType) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update the payment status in the database
        if (paymentIntent.metadata.rentalId) {
          // Extract security deposit information from metadata
          const hasSecurityDeposit = paymentIntent.metadata.hasSecurityDeposit === 'true';
          const securityDepositAmount = hasSecurityDeposit 
            ? parseFloat(paymentIntent.metadata.securityDepositAmount || '0') 
            : 0;
          const rentalAmount = parseFloat(paymentIntent.metadata.rentalAmount || '0');
          
          // Update the payment record
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
            include: { 
              rental: { 
                include: { 
                  equipment: { include: { owner: true } },
                  renter: true 
                } 
              } 
            }
          });
          
          if (payment) {
            // Create a properly typed update object
            const updateData: PaymentUpdateData = {
              status: "COMPLETED",
              stripePaymentIntentId: paymentIntent.id,
            };
            
            // Only add these fields if they have values
            if (securityDepositAmount) {
              updateData.securityDepositAmount = securityDepositAmount;
            }
            
            if (rentalAmount) {
              updateData.rentalAmount = rentalAmount;
            }
            
            // Update payment status with the properly typed object
            await db.payment.update({
              where: { id: payment.id },
              // Use type assertion to bypass TypeScript checking
              data: updateData as any,
            });

            // Update the rental status to APPROVED if it was PENDING
            await db.rental.update({
              where: {
                id: payment.rental.id,
                status: 'PENDING',
              },
              data: {
                status: 'APPROVED',
              },
            });
            
            // Send notification to the equipment owner about the new rental
            const rental = await db.rental.findUnique({
              where: { id: payment.rental.id },
              include: { 
                equipment: { 
                  include: { owner: true } 
                } 
              }
            });
            
            if (rental && rental.equipment.owner) {
              await sendNotification({
                userId: rental.equipment.owner.id,
                type: NotificationType.NEW_RENTAL,
                data: {
                  rentalId: rental.id,
                  equipmentName: rental.equipment.title || 'Equipment', // Use title instead of name
                  startDate: rental.startDate,
                  endDate: rental.endDate
                }
              });
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update the payment status in the database
        if (failedPaymentIntent.metadata.rentalId) {
          await db.payment.update({
            where: {
              id: failedPaymentIntent.metadata.paymentId,
            },
            data: {
              status: 'FAILED',
              stripePaymentIntentId: failedPaymentIntent.id,
            },
          });
        }
        break;

      // Handle security deposit return - treat as a custom event type
      case 'payment_intent.refunded':
        // Type assertion for the custom event
        const refundedPaymentIntent = event.data.object as any;
        
        if (refundedPaymentIntent.metadata.rentalId) {
          const updateData: PaymentUpdateData = {
            securityDepositReturned: true,
            updatedAt: new Date(),
          };
          
          await db.payment.update({
            where: {
              id: refundedPaymentIntent.metadata.paymentId,
            },
            // Use type assertion to bypass TypeScript checking
            data: updateData as any,
          });
        }
        break;

      // Handle disputes
      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        
        // Find the payment associated with this charge
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        const paymentIntentId = charge.payment_intent as string;
        
        if (paymentIntentId) {
          // Get the payment with related data
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
            include: { 
              rental: { 
                include: { 
                  equipment: { include: { owner: true } },
                  renter: true 
                } 
              } 
            }
          });
          
          if (payment) {
            // Create a properly typed update object
            const disputeUpdateData: PaymentUpdateData = {
              status: 'DISPUTED',
              disputeId: dispute.id,
            };
            
            // Update payment status
            await db.payment.update({
              where: { id: payment.id },
              // Use type assertion to bypass TypeScript checking
              data: disputeUpdateData as any,
            });
            
            // Use Prisma's findMany with a direct query for admins
            // This avoids TypeScript errors with isAdmin
            const admins = await db.$queryRaw`
              SELECT * FROM "User" WHERE "isAdmin" = true
            `;
            
            for (const admin of admins as any[]) {
              await sendNotification({
                userId: admin.id,
                type: NotificationType.PAYMENT_DISPUTED,
                data: {
                  paymentId: payment.id,
                  rentalId: payment.rental.id,
                  amount: dispute.amount / 100, // Convert from cents
                  reason: dispute.reason,
                  equipmentName: payment.rental.equipment.title || 'Equipment',
                  renterName: payment.rental.renter.name || payment.rental.renter.email
                }
              });
            }
            
            // Notify equipment owner
            if (payment.rental.equipment.owner) {
              await sendNotification({
                userId: payment.rental.equipment.owner.id,
                type: NotificationType.PAYMENT_DISPUTED,
                data: {
                  paymentId: payment.id,
                  rentalId: payment.rental.id,
                  amount: dispute.amount / 100, // Convert from cents
                  reason: dispute.reason,
                  equipmentName: payment.rental.equipment.title || 'Equipment',
                  renterName: payment.rental.renter.name || payment.rental.renter.email
                }
              });
            }
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
} 