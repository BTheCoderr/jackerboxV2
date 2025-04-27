"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDays, format, isSameDay, isWithinInterval } from "date-fns";

interface Booking {
  startDate: Date;
  endDate: Date;
  status: string;
}

interface AvailabilityCalendarProps {
  equipmentId: string;
  onDateSelect?: (start: Date, end: Date) => void;
  className?: string;
}

export function AvailabilityCalendar({
  equipmentId,
  onDateSelect,
  className = "",
}: AvailabilityCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/equipment/${equipmentId}/bookings`);
        if (!response.ok) throw new Error("Failed to fetch bookings");
        
        const data = await response.json();
        setBookings(
          data.bookings.map((booking: any) => ({
            ...booking,
            startDate: new Date(booking.startDate),
            endDate: new Date(booking.endDate),
          }))
        );
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [equipmentId]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    const newSelectedDates = [...selectedDates];
    
    if (newSelectedDates.length === 2) {
      // Reset selection if we already have two dates
      newSelectedDates.length = 0;
    }
    
    if (newSelectedDates.length === 0) {
      // First selection
      newSelectedDates.push(date);
    } else if (newSelectedDates.length === 1) {
      // Second selection
      const firstDate = newSelectedDates[0];
      if (date < firstDate) {
        newSelectedDates.unshift(date);
      } else {
        newSelectedDates.push(date);
      }
      
      // Notify parent component of selection
      if (onDateSelect) {
        onDateSelect(newSelectedDates[0], newSelectedDates[1]);
      }
    }
    
    setSelectedDates(newSelectedDates);
  };

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => 
      isWithinInterval(date, { start: booking.startDate, end: booking.endDate })
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(date, selectedDate));
  };

  const isDateInRange = (date: Date) => {
    if (selectedDates.length !== 2) return false;
    return isWithinInterval(date, {
      start: selectedDates[0],
      end: selectedDates[1],
    });
  };

  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    selected: (date: Date) => isDateSelected(date),
    inRange: (date: Date) => isDateInRange(date),
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: "#FEE2E2",
      color: "#991B1B",
      cursor: "not-allowed",
    },
    selected: {
      backgroundColor: "#3B82F6",
      color: "white",
    },
    inRange: {
      backgroundColor: "#BFDBFE",
      color: "#1E40AF",
    },
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="font-medium mb-2">Availability Calendar</h3>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="bg-blue-100">
            Selected
          </Badge>
          <Badge variant="outline" className="bg-red-100">
            Booked
          </Badge>
        </div>
      </div>

      <Calendar
        mode="range"
        selected={selectedDates}
        onSelect={handleSelect}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        disabled={[
          { before: new Date() },
          (date: Date) => isDateBooked(date),
        ]}
        numberOfMonths={2}
        showOutsideDays={false}
      />

      {selectedDates.length === 2 && (
        <div className="mt-4 text-sm text-gray-600">
          Selected period: {format(selectedDates[0], "PPP")} - {format(selectedDates[1], "PPP")}
        </div>
      )}
    </Card>
  );
} 