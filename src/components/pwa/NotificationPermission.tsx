"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import { subscribeToPushNotifications, isSubscribedToPushNotifications } from '@/lib/push-notifications';

export function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    // Get the current permission state
    const permission = Notification.permission;
    setPermissionState(permission);

    // Check if already subscribed to push notifications
    const checkSubscription = async () => {
      const subscribed = await isSubscribedToPushNotifications();
      setIsSubscribed(subscribed);
    };
    
    checkSubscription();

    // If permission is not granted or denied, show the prompt
    if (permission !== 'granted' && permission !== 'denied') {
      // Wait a bit before showing the prompt to not overwhelm the user
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      
      if (permission === 'granted') {
        // Send a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive updates from Jackerbox',
          icon: '/icons/icon-192x192.png'
        });
        
        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications();
        setIsSubscribed(!!subscription);
      }
      
      // Hide the prompt regardless of the outcome
      setShowPrompt(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Remember that the user dismissed the prompt
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if the prompt was previously dismissed or permission is already set
  // or if already subscribed to push notifications
  if (!showPrompt || 
      localStorage.getItem('notification-prompt-dismissed') === 'true' || 
      permissionState === 'granted' || 
      permissionState === 'denied' ||
      isSubscribed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 p-4 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Bell size={20} className="text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Enable Notifications
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get updates on bookings, messages, and important alerts
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={requestPermission}
            className="text-xs"
          >
            Enable
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={dismissPrompt}
            className="text-xs"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
} 