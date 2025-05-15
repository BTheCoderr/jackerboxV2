export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { GenerateSampleNotificationsButton } from "@/components/notifications/generate-sample-button";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const metadata: Metadata = {
  title: "Notifications | Jackerbox",
  description: "View your notifications",
};

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

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard/notifications");
  }

  // Fetch notifications from the database
  let notifications = [];
  try {
    notifications = await db.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mark all notifications as read
    if (notifications.length > 0) {
      await db.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <NotificationsClient notifications={notifications} />
    </div>
  );
} 