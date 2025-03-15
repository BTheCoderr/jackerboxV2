import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import webpush from 'web-push';

// Configure web-push with proper VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

// Ensure the private key is properly formatted
// VAPID keys should be URL-safe base64 encoded and the private key should be 32 bytes when decoded
const formattedPrivateKey = vapidPrivateKey.replace(/\\n/g, '\n');

// Only set VAPID details if both keys are available
if (vapidPublicKey && formattedPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:contact@jackerbox.com',
      vapidPublicKey,
      formattedPrivateKey
    );
    console.log('Web Push configured successfully');
  } catch (error) {
    console.error('Failed to configure Web Push:', error);
  }
}

/**
 * API route to send push notifications
 * 
 * This endpoint sends push notifications to users based on the provided criteria.
 * It requires admin privileges to send to all users or specific user groups.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated and has admin privileges
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the notification data from the request
    const { 
      title, 
      body, 
      url, 
      userId, 
      sendToAll = false,
      actions = []
    } = await req.json();
    
    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }
    
    // Check if the user is an admin for sending to all users
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });
    
    if (sendToAll && !currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to send to all users' },
        { status: 403 }
      );
    }
    
    // If no VAPID keys are configured, return an error
    if (!vapidPublicKey || !formattedPrivateKey) {
      return NextResponse.json(
        { error: 'Push notifications are not configured' },
        { status: 500 }
      );
    }
    
    // Prepare the notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      actions,
      timestamp: Date.now()
    });
    
    // Query for subscriptions
    const subscriptionsQuery = {
      where: userId ? { userId } : undefined,
      select: {
        endpoint: true,
        auth: true,
        p256dh: true
      }
    };
    
    const subscriptions = await db.pushSubscription.findMany(subscriptionsQuery);
    
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No subscriptions found' },
        { status: 404 }
      );
    }
    
    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        if (!subscription.auth || !subscription.p256dh) {
          return { status: 'skipped', endpoint: subscription.endpoint };
        }
        
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                auth: subscription.auth,
                p256dh: subscription.p256dh
              }
            },
            payload
          );
          
          return { status: 'success', endpoint: subscription.endpoint };
        } catch (error) {
          // If the subscription is no longer valid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.pushSubscription.delete({
              where: { endpoint: subscription.endpoint }
            });
          }
          
          return { 
            status: 'error', 
            endpoint: subscription.endpoint, 
            error: error.message 
          };
        }
      })
    );
    
    // Count successes and failures
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return NextResponse.json({
      success: true,
      message: `Sent ${succeeded} notifications, ${failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
} 