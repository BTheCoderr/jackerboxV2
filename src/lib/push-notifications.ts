/**
 * Push Notification Utilities
 * 
 * This file contains utility functions for handling push notification subscriptions.
 */

// VAPID public key for push notifications
// In a real application, this would be generated and stored securely
const PUBLIC_VAPID_KEY = 'BLBz-YrPwbP8N0RxLsRYOGwWRLlvf0Wo0WQwg6Qy9-HGC_c-pTfGg-Qn5bNL1vQFqQJkmGdABGXJHQQE3C3hZSA';

/**
 * Convert a base64 string to a Uint8Array for the push server
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 * @returns The push subscription object or null if subscription fails
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return null;
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // Send the subscription to the server
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Send the subscription to the server
 * @param subscription The push subscription object
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    console.log('Push notification subscription sent to server');
  } catch (error) {
    console.error('Error sending subscription to server:', error);
  }
}

/**
 * Unsubscribe from push notifications
 * @returns True if unsubscription was successful, false otherwise
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }

    // Unsubscribe from push notifications
    const success = await subscription.unsubscribe();
    
    if (success) {
      // Notify the server about unsubscription
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    return success;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Check if the user is subscribed to push notifications
 * @returns True if the user is subscribed, false otherwise
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return !!subscription;
  } catch (error) {
    console.error('Error checking push notification subscription:', error);
    return false;
  }
} 