export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const metadata: Metadata = {
  title: "Notifications | Jackerbox",
  description: "View your notifications",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard/notifications");
  }

  // Fetch notifications from the database
  let notifications: Awaited<ReturnType<typeof db.notification.findMany>> = [];
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