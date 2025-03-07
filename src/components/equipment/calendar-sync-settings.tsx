"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the form schema
const calendarSyncSchema = z.object({
  calendarType: z.enum(["google", "ical"]),
  calendarId: z.string().optional(),
  icalUrl: z.string().url().optional(),
  syncDirection: z.enum(["import", "export", "both"]),
  syncFrequency: z.enum(["hourly", "daily", "manual"]),
});

type CalendarSyncFormValues = z.infer<typeof calendarSyncSchema>;

interface CalendarSyncSettingsProps {
  equipmentId: string;
  userId: string;
  onSuccess?: () => void;
}

export function CalendarSyncSettings({
  equipmentId,
  userId,
  onSuccess,
}: CalendarSyncSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CalendarSyncFormValues>({
    resolver: zodResolver(calendarSyncSchema),
    defaultValues: {
      calendarType: "google",
      syncDirection: "import",
      syncFrequency: "daily",
    },
  });

  const calendarType = watch("calendarType");
  const syncDirection = watch("syncDirection");

  const onSubmit = async (data: CalendarSyncFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/equipment/${equipmentId}/calendar-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
          equipmentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save calendar sync settings");
      }

      const responseData = await response.json();
      setSuccess(responseData.message || "Calendar sync settings saved successfully");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    // Redirect to Google OAuth flow
    window.location.href = `/api/auth/google-calendar?equipmentId=${equipmentId}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Calendar Sync Settings</h3>

      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 text-green-600 rounded-md text-sm mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Calendar Type</label>
          <select
            {...register("calendarType")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="google">Google Calendar</option>
            <option value="ical">iCal / Apple Calendar</option>
          </select>
          {errors.calendarType && (
            <p className="text-red-500 text-xs mt-1">{errors.calendarType.message}</p>
          )}
        </div>

        {calendarType === "google" && (
          <div>
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              Connect Google Calendar
            </button>
            <p className="text-xs text-gray-500 mt-1">
              You'll be redirected to Google to authorize access to your calendar.
            </p>
          </div>
        )}

        {calendarType === "ical" && (
          <div>
            <label className="block text-sm font-medium mb-1">iCal URL</label>
            <input
              type="url"
              {...register("icalUrl")}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            />
            {errors.icalUrl && (
              <p className="text-red-500 text-xs mt-1">{errors.icalUrl.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter the URL of your iCal feed. You can find this in your calendar settings.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Sync Direction</label>
          <select
            {...register("syncDirection")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading || (calendarType === "ical" && syncDirection === "export")}
          >
            <option value="import">Import Only (External → Jackerbox)</option>
            {calendarType !== "ical" && (
              <option value="export">Export Only (Jackerbox → External)</option>
            )}
            {calendarType !== "ical" && (
              <option value="both">Both Directions</option>
            )}
          </select>
          {errors.syncDirection && (
            <p className="text-red-500 text-xs mt-1">{errors.syncDirection.message}</p>
          )}
          {calendarType === "ical" && (
            <p className="text-xs text-gray-500 mt-1">
              iCal only supports importing events to Jackerbox.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sync Frequency</label>
          <select
            {...register("syncFrequency")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="manual">Manual Only</option>
          </select>
          {errors.syncFrequency && (
            <p className="text-red-500 text-xs mt-1">{errors.syncFrequency.message}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Calendar Settings"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium mb-2">Your iCal Feed</h4>
        <p className="text-sm text-gray-600 mb-2">
          Use this URL to import your Jackerbox availability into other calendar apps:
        </p>
        <div className="flex">
          <input
            type="text"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/equipment/${equipmentId}/ical`}
            readOnly
            className="flex-1 p-2 border rounded-l-md bg-gray-50"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                `${typeof window !== "undefined" ? window.location.origin : ""}/api/equipment/${equipmentId}/ical`
              );
              setSuccess("URL copied to clipboard");
            }}
            className="px-4 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
} 