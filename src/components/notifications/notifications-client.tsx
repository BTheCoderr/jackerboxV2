"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { GenerateSampleNotificationsButton } from "@/components/notifications/generate-sample-button";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationData {
  amount?: number;
  propertyName?: string;
  checkIn?: string;
  checkOut?: string;
  rentalId?: string;
  [key: string]: any;
}

interface NotificationType {
  id: string;
  type: string;
  userId: string;
  data: NotificationData | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function NotificationsClient({ notifications = [] }: { notifications: NotificationType[] }) {
  const [activeTab, setActiveTab] = useState("notifications");

  // Helper function to get notification message
  const getNotificationMessage = (notification: NotificationType) => {
    const data = notification.data || {};
    
    switch (notification.type) {
      case "PAYMENT_RECEIVED":
        return `Payment of $${data.amount || 0} received`;
      case "PAYMENT_FAILED":
        return `Payment of $${data.amount || 0} failed`;
      case "RENTAL_BOOKED":
        return `New booking confirmed for ${data.propertyName || 'your rental'}`;
      case "RENTAL_CANCELLED":
        return `Booking for ${data.propertyName || 'your rental'} was cancelled`;
      case "PAYOUT_PROCESSED":
        return `Payout of $${data.amount || 0} processed`;
      case "SECURITY_DEPOSIT_RETURNED":
        return `Security deposit of $${data.amount || 0} returned`;
      case "RENTAL_UPDATE":
        return data.message || "Your rental has been updated";
      default:
        return data.message || "New notification";
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {activeTab === "notifications" && <GenerateSampleNotificationsButton />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">You have no notifications</p>
              <p className="text-sm text-gray-400">
                Click the "Generate Sample Notifications" button above to create sample notifications for demonstration purposes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </>
  );
} 