"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { addDays, format, isBefore, isAfter, isSameDay } from "date-fns";

interface AvailabilityCalendarProps {
  equipmentId: string;
  existingBookings?: {
    startDate: Date;
    endDate: Date;
    status: string;
  }[];
  onDateSelect?: (startDate: Date, endDate: Date) => void;
  minRentalDays?: number;
  maxRentalDays?: number;
}

export function AvailabilityCalendar({
  equipmentId,
  existingBookings = [],
  onDateSelect,
  minRentalDays = 1,
  maxRentalDays = 30,
}: AvailabilityCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  const [error, setError] = useState<string | null>(null);
  
  // Convert existing bookings to Date objects
  const bookings = existingBookings.map(booking => ({
    ...booking,
    startDate: new Date(booking.startDate),
    endDate: new Date(booking.endDate),
  }));
  
  // Function to check if a date is booked
  const isDateBooked = (date: Date) => {
    return bookings.some(booking => {
      const isWithinRange = !isBefore(date, booking.startDate) && !isAfter(date, booking.endDate);
      return isWithinRange && booking.status !== 'cancelled';
    });
  };
  
  // Function to check if a date range is valid
  const isValidDateRange = (start: Date, end: Date) => {
    // Check minimum rental period
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < minRentalDays) {
      setError(`Minimum rental period is ${minRentalDays} days`);
      return false;
    }
    
    // Check maximum rental period
    if (daysDiff > maxRentalDays) {
      setError(`Maximum rental period is ${maxRentalDays} days`);
      return false;
    }
    
    // Check for conflicts with existing bookings
    let currentDate = start;
    while (!isAfter(currentDate, end)) {
      if (isDateBooked(currentDate)) {
        setError('Selected dates conflict with existing bookings');
        return false;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    setError(null);
    return true;
  };
  
  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedRange(current => {
      // If no start date is selected, set it
      if (!current.from) {
        return {
          from: date,
          to: undefined,
        };
      }
      
      // If end date is being selected
      if (!current.to && !isBefore(date, current.from)) {
        const isValid = isValidDateRange(current.from, date);
        if (!isValid) {
          return current;
        }
        
        const newRange = {
          from: current.from,
          to: date,
        };
        
        // Notify parent component of selection
        if (onDateSelect) {
          onDateSelect(newRange.from, newRange.to);
        }
        
        return newRange;
      }
      
      // If a complete range was already selected, start a new selection
      return {
        from: date,
        to: undefined,
      };
    });
  };
  
  // Function to get day class names based on status
  const getDayClassName = (date: Date) => {
    const isSelected = selectedRange.from && (
      isSameDay(date, selectedRange.from) ||
      (selectedRange.to && (
        isSameDay(date, selectedRange.to) ||
        (isAfter(date, selectedRange.from) && isBefore(date, selectedRange.to))
      ))
    );
    
    const isBooked = isDateBooked(date);
    
    return `h-9 w-9 rounded-md ${
      isSelected
        ? 'bg-black text-white'
        : isBooked
        ? 'bg-red-100 text-red-600 cursor-not-allowed'
        : 'hover:bg-gray-100'
    }`;
  };
  
  return (
    <div className="space-y-4">
      <Calendar
        mode="range"
        selected={selectedRange}
        onSelect={date => handleSelect(date)}
        disabled={(date) => isBefore(date, new Date()) || isDateBooked(date)}
        className="rounded-md border"
        classNames={{
          day: getDayClassName,
        }}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {selectedRange.from && selectedRange.to && !error && (
        <div className="text-sm text-gray-600">
          Selected dates:{' '}
          <span className="font-medium">
            {format(selectedRange.from, 'MMM d, yyyy')}
          </span>
          {' to '}
          <span className="font-medium">
            {format(selectedRange.to, 'MMM d, yyyy')}
          </span>
        </div>
      )}
      
      {selectedRange.from && selectedRange.to && !error && (
        <Button
          onClick={() => setSelectedRange({ from: undefined, to: undefined })}
          variant="outline"
          className="w-full"
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
} 