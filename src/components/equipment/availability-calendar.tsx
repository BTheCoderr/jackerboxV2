"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, addWeeks, addMonths, isSameDay, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from 'sonner';

// Set up the localizer for the calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AvailabilityCalendarProps {
  equipmentId: string;
  isOwner: boolean;
  existingBookings?: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
  }>;
  onDateSelect?: (startDate: Date, endDate: Date) => void;
}

interface Booking {
  startDate: string;
  endDate: string;
  status: string;
}

interface Availability {
  bookings: Booking[];
  blackoutDates: string[];
  availabilitySchedule: Record<string, any>;
}

export function AvailabilityCalendar({
  equipmentId,
  isOwner,
  existingBookings = [],
  onDateSelect,
}: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<Array<any>>([]);
  const [newAvailability, setNewAvailability] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  // New state for recurring availability
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<string[]>([]);

  // Define the date range type
  interface DateRange {
    start: Date;
    end: Date;
  }

  // Load existing bookings and availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/equipment/${equipmentId}/availability`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();
        
        // Convert availability data to calendar events
        const availabilityEvents = data.availability.map((item: any) => ({
          id: item.id,
          title: "Available",
          start: new Date(item.startDate),
          end: new Date(item.endDate),
          status: "available",
          allDay: true,
          className: "bg-green-200",
        }));

        // Convert existing bookings to calendar events
        const bookingEvents = existingBookings.map((booking) => ({
          id: booking.id,
          title: `Booked: ${booking.title}`,
          start: new Date(booking.start),
          end: new Date(booking.end),
          status: booking.status,
          allDay: true,
          className: booking.status === "Approved" ? "bg-red-200" : "bg-yellow-200",
        }));

        // Combine both types of events
        setEvents([...availabilityEvents, ...bookingEvents]);
        setAvailability(data);
      } catch (error) {
        console.error("Error fetching availability:", error);
        setError("Failed to load availability. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [equipmentId, existingBookings]);

  // Handle selecting a date range on the calendar
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!isOwner) return; // Only owners can modify availability
    
    // Adjust end date to be inclusive (end of day)
    const adjustedEnd = new Date(end);
    adjustedEnd.setHours(23, 59, 59);
    
    // Store the selection in state
    setNewAvailability({
      start: new Date(start),
      end: adjustedEnd,
    });
    
    // Set default recurrence end date to 3 months from start
    const defaultEndDate = new Date(start);
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
    setRecurrenceEndDate(defaultEndDate);
    
    // Ensure the selection is visible in the UI
    setError(null); // Clear any previous errors
  };

  // Generate recurring dates based on the pattern
  const generateRecurringDates = () => {
    if (!newAvailability.start || !newAvailability.end || !recurrenceEndDate) return [];
    
    // Initialize dates array with proper type
    const dates: Array<DateRange> = [];
    
    // Calculate duration in milliseconds
    const duration = newAvailability.end.getTime() - newAvailability.start.getTime();
    
    // Set up the current start date
    let currentStart = new Date(newAvailability.start);
    
    // Generate dates based on recurrence pattern
    while (currentStart <= recurrenceEndDate) {
      // Skip dates that don't match the selected days of week
      if (recurrenceType === "weekly" && recurrenceDaysOfWeek.length > 0) {
        const dayOfWeek = format(currentStart, "EEEE").toLowerCase();
        if (!recurrenceDaysOfWeek.includes(dayOfWeek)) {
          currentStart = addDays(currentStart, 1);
          continue;
        }
      }
      
      const currentEnd = new Date(currentStart.getTime() + duration);
      
      dates.push({
        start: new Date(currentStart),
        end: new Date(currentEnd),
      });
      
      // Advance to next occurrence based on recurrence type
      if (recurrenceType === "daily") {
        currentStart = addDays(currentStart, recurrenceInterval);
      } else if (recurrenceType === "weekly") {
        if (recurrenceDaysOfWeek.length > 0) {
          currentStart = addDays(currentStart, 1);
        } else {
          currentStart = addWeeks(currentStart, recurrenceInterval);
        }
      } else if (recurrenceType === "monthly") {
        currentStart = addMonths(currentStart, recurrenceInterval);
      }
    }
    
    return dates;
  };

  // Save new availability with recurrence
  const handleSaveAvailability = async () => {
    if (!newAvailability.start || !newAvailability.end) {
      setError("Please select a date range first");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (isRecurring && recurrenceEndDate) {
        // Handle recurring availability
        const recurringDates = generateRecurringDates();
        
        if (recurringDates.length === 0) {
          throw new Error("No valid dates generated for recurring availability");
        }
        
        // Create all recurring availabilities
        const response = await fetch(`/api/equipment/${equipmentId}/availability/recurring`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dates: recurringDates,
            recurrenceType,
            recurrenceInterval,
            recurrenceEndDate: recurrenceEndDate.toISOString(),
            recurrenceDaysOfWeek: recurrenceDaysOfWeek.length > 0 ? JSON.stringify(recurrenceDaysOfWeek) : null,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to save recurring availability");
        }
        
        // Add all the new availabilities to the calendar
        const newEvents = data.availabilities.map((availability: any) => ({
          id: availability.id,
          title: "Available",
          start: new Date(availability.startDate),
          end: new Date(availability.endDate),
          status: "available",
          allDay: true,
          className: "bg-green-200",
        }));
        
        setEvents([...events, ...newEvents]);
      } else {
        // Handle single availability
        const response = await fetch(`/api/equipment/${equipmentId}/availability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: newAvailability.start.toISOString(),
            endDate: newAvailability.end.toISOString(),
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to save availability");
        }
        
        // Add the new availability to the calendar
        setEvents([
          ...events,
          {
            id: data.availability.id,
            title: "Available",
            start: new Date(data.availability.startDate),
            end: new Date(data.availability.endDate),
            status: "available",
            allDay: true,
            className: "bg-green-200",
          },
        ]);
      }

      // Reset the form
      setNewAvailability({ start: null, end: null });
      setIsRecurring(false);
      setRecurrenceType("weekly");
      setRecurrenceEndDate(null);
      setRecurrenceInterval(1);
      setRecurrenceDaysOfWeek([]);
    } catch (error) {
      console.error("Error saving availability:", error);
      setError(error instanceof Error ? error.message : "Failed to save availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle a day of week for weekly recurrence
  const toggleDayOfWeek = (day: string) => {
    if (recurrenceDaysOfWeek.includes(day)) {
      setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== day));
    } else {
      setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day]);
    }
  };

  // Custom event styling
  const eventStyleGetter = (event: any) => {
    let style = {
      backgroundColor: event.status === "available" ? "#10B981" : // green
                       event.status === "Approved" ? "#EF4444" : // red
                       "#F59E0B", // yellow for pending
      borderRadius: "5px",
      color: "#fff",
      border: "none",
      display: "block",
    };
    
    return {
      style,
    };
  };

  const isDateUnavailable = (date: Date) => {
    if (!availability) return false;

    // Check if date is in blackout dates
    const isBlackout = availability.blackoutDates.some(blackoutDate => 
      isSameDay(parseISO(blackoutDate), date)
    );
    if (isBlackout) return true;

    // Check if date overlaps with any existing bookings
    const isBooked = availability.bookings.some(booking => {
      const bookingStart = parseISO(booking.startDate);
      const bookingEnd = parseISO(booking.endDate);
      return date >= bookingStart && date <= bookingEnd;
    });

    return isBooked;
  };

  const handleSelect = (dates: { from: Date | undefined; to: Date | undefined }) => {
    setSelectedDates(dates);
    if (dates.from && dates.to && onDateSelect) {
      onDateSelect(dates.from, dates.to);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium">Availability Calendar</h3>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="h-96 bg-white rounded-md shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          selectable={isOwner}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          views={["month"]}
          defaultView="month"
          longPressThreshold={10}
          selected={newAvailability.start && newAvailability.end ? [newAvailability] : []}
          onSelecting={() => true} // Always allow selection
        />
      </div>
      
      {isOwner && newAvailability.start && newAvailability.end && (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h4 className="font-medium mb-2">Add New Availability</h4>
          <p className="text-sm text-gray-600 mb-4">
            {format(newAvailability.start, "MMMM d, yyyy")} - {format(newAvailability.end, "MMMM d, yyyy")}
          </p>
          
          {/* Recurring availability toggle */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Make this a recurring availability</span>
            </label>
          </div>
          
          {/* Recurring availability options */}
          {isRecurring && (
            <div className="space-y-4 mb-4 p-4 bg-gray-100 rounded-md">
              <div>
                <label className="block text-sm font-medium mb-1">Recurrence Type</label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              {recurrenceType === "weekly" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(day)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          recurrenceDaysOfWeek.includes(day)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {recurrenceDaysOfWeek.length === 0
                      ? "If no days are selected, the event will repeat weekly on the same day of the week."
                      : ""}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Repeat Every</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className="w-16 p-2 border border-gray-300 rounded-md"
                  />
                  <span className="ml-2 text-sm">
                    {recurrenceType === "daily"
                      ? "day(s)"
                      : recurrenceType === "weekly"
                      ? "week(s)"
                      : "month(s)"}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={recurrenceEndDate ? format(recurrenceEndDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setRecurrenceEndDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleSaveAvailability}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {isLoading ? "Saving..." : isRecurring ? "Save Recurring Availability" : "Save Availability"}
            </button>
            <button
              onClick={() => setNewAvailability({ start: null, end: null })}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
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
      
      {isOwner && (
        <p className="text-sm text-gray-600">
          Click and drag on the calendar to add new availability periods. Use the recurring option for regular schedules.
        </p>
      )}
    </div>
  );
} 