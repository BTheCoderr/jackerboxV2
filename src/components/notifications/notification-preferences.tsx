"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Bell, Mail, PhoneCall } from "lucide-react";
import { isSubscribedToPushNotifications, subscribeToPushNotifications, unsubscribeFromPushNotifications } from "@/lib/push-notifications";

interface NotificationPreference {
  type: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: "RENTAL_BOOKED",
      description: "When someone books your equipment",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "RENTAL_CANCELLED",
      description: "When a booking is cancelled",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "PAYMENT_RECEIVED",
      description: "When you receive a payment",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "PAYOUT_PROCESSED",
      description: "When your payout is processed",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "MESSAGE_RECEIVED",
      description: "When you receive a message",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "REVIEW_RECEIVED",
      description: "When you receive a review",
      email: true,
      push: true,
      inApp: true,
    },
    {
      type: "SECURITY_DEPOSIT_RETURNED",
      description: "When your security deposit is returned",
      email: true,
      push: true,
      inApp: true,
    },
  ]);
  
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported and enabled
    const checkPushSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsPushSupported(supported);
      
      if (supported) {
        const subscribed = await isSubscribedToPushNotifications();
        setIsPushEnabled(subscribed);
      }
    };
    
    // Fetch user preferences from the API
    const fetchPreferences = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/notifications/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences && Array.isArray(data.preferences)) {
            // Merge with default preferences to ensure all types are included
            const mergedPreferences = [...preferences];
            
            data.preferences.forEach((pref: any) => {
              const index = mergedPreferences.findIndex(p => p.type === pref.type);
              if (index !== -1) {
                mergedPreferences[index] = {
                  ...mergedPreferences[index],
                  email: pref.email,
                  push: pref.push,
                  inApp: pref.inApp,
                };
              }
            });
            
            setPreferences(mergedPreferences);
          }
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPushSupport();
    fetchPreferences();
  }, []);

  const handleToggleAll = (channel: 'email' | 'push' | 'inApp', value: boolean) => {
    setPreferences(prev =>
      prev.map(pref => ({
        ...pref,
        [channel]: value,
      }))
    );
  };

  const handleTogglePreference = (index: number, channel: 'email' | 'push' | 'inApp') => {
    setPreferences(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [channel]: !updated[index][channel],
      };
      return updated;
    });
  };

  const handleTogglePushNotifications = async () => {
    if (!isPushSupported) return;
    
    try {
      if (isPushEnabled) {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsPushEnabled(false);
          toast.success('Push notifications disabled');
          // Update all push preferences to false
          handleToggleAll('push', false);
        } else {
          toast.error('Failed to disable push notifications');
        }
      } else {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsPushEnabled(true);
          toast.success('Push notifications enabled');
        } else {
          toast.error('Failed to enable push notifications');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('An error occurred');
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (response.ok) {
        toast.success('Notification preferences saved');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-jacker-blue"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {isPushSupported && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                {isPushEnabled 
                  ? 'Push notifications are enabled for this browser' 
                  : 'Enable push notifications to receive alerts even when not on the site'}
              </p>
            </div>
            <button
              onClick={handleTogglePushNotifications}
              className={`px-4 py-2 rounded-md ${
                isPushEnabled 
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                  : 'bg-jacker-blue text-white hover:bg-opacity-90'
              }`}
            >
              {isPushEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-200 mb-2">
          <div className="col-span-1 font-medium">Notification Type</div>
          <div className="text-center font-medium">Email</div>
          <div className="text-center font-medium">Push</div>
          <div className="text-center font-medium">In-App</div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-200 mb-4">
          <div className="col-span-1 font-medium text-sm text-gray-600">Toggle All</div>
          <div className="text-center">
            <button 
              onClick={() => handleToggleAll('email', !preferences.every(p => p.email))}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200"
            >
              <Mail className={`h-5 w-5 ${preferences.every(p => p.email) ? 'text-jacker-blue' : 'text-gray-400'}`} />
            </button>
          </div>
          <div className="text-center">
            <button 
              onClick={() => handleToggleAll('push', !preferences.every(p => p.push))}
              className={`h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 ${!isPushEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isPushEnabled}
            >
              <Bell className={`h-5 w-5 ${preferences.every(p => p.push) ? 'text-jacker-blue' : 'text-gray-400'}`} />
            </button>
          </div>
          <div className="text-center">
            <button 
              onClick={() => handleToggleAll('inApp', !preferences.every(p => p.inApp))}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200"
            >
              <PhoneCall className={`h-5 w-5 ${preferences.every(p => p.inApp) ? 'text-jacker-blue' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
        
        {preferences.map((preference, index) => (
          <div key={preference.type} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100">
            <div className="col-span-1">
              <p className="font-medium">{preference.description}</p>
            </div>
            <div className="text-center">
              <button 
                onClick={() => handleTogglePreference(index, 'email')}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <Mail className={`h-5 w-5 ${preference.email ? 'text-jacker-blue' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="text-center">
              <button 
                onClick={() => handleTogglePreference(index, 'push')}
                className={`h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 ${!isPushEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isPushEnabled}
              >
                <Bell className={`h-5 w-5 ${preference.push ? 'text-jacker-blue' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="text-center">
              <button 
                onClick={() => handleTogglePreference(index, 'inApp')}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <PhoneCall className={`h-5 w-5 ${preference.inApp ? 'text-jacker-blue' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Email notifications will be sent to your registered email address.</p>
        <p>Push notifications will only be received on browsers where you've enabled them.</p>
        <p>In-app notifications will always be shown in your notification center.</p>
      </div>
    </div>
  );
} 