"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { CalendarIcon } from "lucide-react";

// Lazy load the AvailabilityCalendar component
const AvailabilityCalendar = dynamic(
  () => import("./availability-calendar").then(mod => ({ default: mod.AvailabilityCalendar })),
  {
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ),
    ssr: false
  }
);

// Memoize the calendar legend to prevent unnecessary re-renders
const CalendarLegend = memo(() => (
  <div className="mt-4">
    <div className="flex space-x-4 text-sm">
      <div className="flex items-center">
        <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
        <span>Available</span>
      </div>
      <div className="flex items-center">
        <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
        <span>Pending Booking</span>
      </div>
      <div className="flex items-center">
        <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
        <span>Booked</span>
      </div>
    </div>
  </div>
));

CalendarLegend.displayName = 'CalendarLegend';

interface DualCalendarSystemProps {
  equipmentId: string;
  isOwner: boolean;
  existingBookings?: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
  }>;
}

export function DualCalendarSystem({
  equipmentId,
  isOwner,
  existingBookings = [],
}: DualCalendarSystemProps) {
  const [useSimpleCalendar, setUseSimpleCalendar] = useState(true); // Default to simple calendar
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(
    format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );

  // Handle date changes with validation
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, update end date
    if (new Date(endDate) <= new Date(newStartDate)) {
      const nextDay = new Date(newStartDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(format(nextDay, "yyyy-MM-dd"));
    }
  }, [endDate]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (new Date(newEndDate) >= new Date(startDate)) {
      setEndDate(newEndDate);
    }
  }, [startDate]);

  const toggleCalendarType = useCallback(() => {
    setUseSimpleCalendar(!useSimpleCalendar);
  }, [useSimpleCalendar]);

  // Memoize the formatted dates to prevent recalculation on every render
  const formattedStartDate = useCallback(() => {
    return format(new Date(startDate), "MMMM d, yyyy");
  }, [startDate]);

  const formattedEndDate = useCallback(() => {
    return format(new Date(endDate), "MMMM d, yyyy");
  }, [endDate]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Availability Calendar</h3>
        <button
          onClick={toggleCalendarType}
          className="text-sm text-blue-600 hover:underline flex items-center"
          id="calendar-toggle-button"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          Switch to {useSimpleCalendar ? "Interactive" : "Simple"} Calendar
        </button>
      </div>

      {useSimpleCalendar ? (
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min={startDate}
              />
            </div>
          </div>

          <CalendarLegend />

          <div className="mt-4 text-sm text-gray-500">
            <p>Selected rental period: {formattedStartDate()} to {formattedEndDate()}</p>
          </div>
        </div>
      ) : (
        <AvailabilityCalendar
          equipmentId={equipmentId}
          isOwner={isOwner}
          existingBookings={existingBookings}
        />
      )}
    </div>
  );
} 