"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  data: any;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      
      // Ensure notifications is an array before setting state
      const notificationsArray = Array.isArray(data) ? data : 
                                (data.notifications && Array.isArray(data.notifications)) ? 
                                data.notifications : [];
      
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Set empty array on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      
      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    if (!notification || !notification.data) {
      return "New notification";
    }
    
    try {
      // Handle both string JSON and object data formats
      const data = typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;
      
      switch (notification.type) {
        case "PAYMENT_RECEIVED":
          return `Payment of $${data.amount || 0} received`;
        case "PAYMENT_FAILED":
          return `Payment of $${data.amount || 0} failed`;
        case "RENTAL_BOOKED":
          return `New booking confirmed for ${data.propertyName || 'your equipment'}`;
        case "RENTAL_CANCELLED":
          return `Booking for ${data.propertyName || 'your equipment'} was cancelled`;
        case "PAYOUT_PROCESSED":
          return `Payout of $${data.amount || 0} processed`;
        case "SECURITY_DEPOSIT_RETURNED":
          return `Security deposit of $${data.amount || 0} returned`;
        case "RENTAL_UPDATE":
          return data.message || "Your rental has been updated";
        default:
          return data.message || "New notification";
      }
    } catch (error) {
      console.error("Error parsing notification data:", error);
      return "New notification";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification) return;
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    try {
      // Handle both string JSON and object data formats
      const data = typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;
      
      // Navigate based on the link in the data or fallback to type-based routing
      if (data && data.linkUrl) {
        router.push(data.linkUrl);
      } else {
        // Handle navigation based on notification type
        switch (notification.type) {
          case "PAYMENT_RECEIVED":
          case "PAYMENT_FAILED":
            router.push(`/routes/rentals/${data?.rentalId || ''}`);
            break;
          case "RENTAL_BOOKED":
          case "RENTAL_CANCELLED":
          case "RENTAL_UPDATE":
            router.push(`/routes/rentals/${data?.rentalId || ''}`);
            break;
          case "PAYOUT_PROCESSED":
            router.push(`/routes/dashboard/earnings`);
            break;
          default:
            router.push("/routes/dashboard");
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      router.push("/routes/dashboard");
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="py-2 px-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {getNotificationMessage(notification)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="py-2 px-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => window.location.href = "/routes/dashboard/notifications"}
              className="text-xs text-blue-600 hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 