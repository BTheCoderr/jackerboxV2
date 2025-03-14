import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API route to handle unsubscribing from push notifications
 * 
 * This endpoint removes the subscription from the database.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the endpoint from the request
    const { endpoint } = await req.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }
    
    // Check if the subscription exists
    const existingSubscription = await db.pushSubscription.findUnique({
      where: {
        endpoint,
      },
    });
    
    if (!existingSubscription) {
      return NextResponse.json(
        { success: true, message: 'Subscription not found' },
        { status: 200 }
      );
    }
    
    // Delete the subscription
    await db.pushSubscription.delete({
      where: {
        endpoint,
      },
    });
    
    return NextResponse.json(
      { success: true, message: 'Unsubscribed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
} 