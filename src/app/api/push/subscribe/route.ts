import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API route to handle push notification subscriptions
 * 
 * This endpoint stores the subscription in the database for the current user
 * or for a guest user if not authenticated.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the subscription object from the request
    const subscription = await req.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Store the subscription in the database
    await db.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
        userId: userId || null,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
        userId: userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(
      { success: true, message: 'Subscription saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

/**
 * API route to check if a subscription exists
 */
export async function GET(req: NextRequest) {
  try {
    // Get the endpoint from the query parameters
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if the subscription exists
    const subscription = await db.pushSubscription.findUnique({
      where: {
        endpoint,
      },
    });
    
    return NextResponse.json(
      { exists: !!subscription },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
} 