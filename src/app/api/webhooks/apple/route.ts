import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// Verify Apple webhook signature
const verifyAppleSignature = (payload: string, signature: string): boolean => {
  try {
    const publicKey = process.env.APPLE_WEBHOOK_PUBLIC_KEY;
    if (!publicKey) {
      console.error('Apple webhook public key not configured');
      return false;
    }

    const verifier = crypto.createVerify('sha256');
    verifier.update(payload);
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('Error verifying Apple webhook signature:', error);
    return false;
  }
};

// Validate webhook payload
const validatePayload = (payload: any): boolean => {
  const requiredFields = ['type', 'sub'];
  return requiredFields.every(field => payload[field]);
};

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await ratelimit.limit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-apple-signature');

    // Verify signature if in production
    if (process.env.NODE_ENV === 'production' && signature) {
      if (!verifyAppleSignature(rawBody, signature)) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse and validate payload
    const payload = JSON.parse(rawBody);
    if (!validatePayload(payload)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Log webhook event in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Apple webhook payload:', payload);
    }
    
    // Handle different event types
    switch (payload.type) {
      case 'email-disabled':
      case 'consent-revoked':
        // User has revoked access or disabled their Apple ID
        if (payload.sub) {
          // First find the user by email since Apple ID might be in sub
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: payload.email },
                { appleId: payload.sub }
              ]
            }
          });
          
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                appleId: null,
                // Log the event
                updatedAt: new Date(),
              }
            });

            // Log the event
            await prisma.notification.create({
              data: {
                type: 'APPLE_AUTH_REVOKED',
                userId: user.id,
                data: {
                  event: payload.type,
                  timestamp: new Date().toISOString()
                }
              }
            });
          }
        }
        break;
        
      case 'account-delete':
        if (payload.sub) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: payload.email },
                { appleId: payload.sub }
              ]
            }
          });
          
          if (user) {
            // Create a notification before deleting
            await prisma.notification.create({
              data: {
                type: 'ACCOUNT_DELETED',
                userId: user.id,
                data: {
                  event: 'apple_account_delete',
                  timestamp: new Date().toISOString()
                }
              }
            });

            await prisma.user.delete({
              where: { id: user.id }
            });
          }
        }
        break;
        
      default:
        console.log('Unhandled Apple webhook event:', payload.type);
    }
    
    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing Apple webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 