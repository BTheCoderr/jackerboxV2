"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AvailabilityCalendar } from "./availability-calendar";
import { CalendarIcon } from "lucide-react";

// Extend Window interface to include our calendar state
declare global {
  interface Window {
    calendarState?: {
      useSimpleCalendar: boolean;
      setUseSimpleCalendar: (value: boolean) => void;
      startDate: string;
      setStartDate: (value: string) => void;
      endDate: string;
      setEndDate: (value: string) => void;
    };
  }
}

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

  // Make the calendar state globally accessible for other components
  useEffect(() => {
    // Expose calendar state to window for other components to access
    window.calendarState = {
      useSimpleCalendar,
      setUseSimpleCalendar,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
    };
    
    return () => {
      // Clean up when component unmounts
      delete window.calendarState;
    };
  }, [useSimpleCalendar, startDate, endDate]);

  // Handle date changes with validation
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, update end date
    if (new Date(endDate) <= new Date(newStartDate)) {
      const nextDay = new Date(newStartDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(format(nextDay, "yyyy-MM-dd"));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (new Date(newEndDate) >= new Date(startDate)) {
      setEndDate(newEndDate);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Availability Calendar</h3>
        <button
          onClick={() => setUseSimpleCalendar(!useSimpleCalendar)}
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

          <div className="mt-4 text-sm text-gray-500">
            <p>Selected rental period: {format(new Date(startDate), "MMMM d, yyyy")} to {format(new Date(endDate), "MMMM d, yyyy")}</p>
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