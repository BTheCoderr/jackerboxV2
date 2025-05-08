import { addDays, differenceInDays, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { Booking } from '@prisma/client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const isDateInRange = (date: Date, range: DateRange): boolean => {
  return (
    (isSameDay(date, range.startDate) || isAfter(date, range.startDate)) &&
    (isSameDay(date, range.endDate) || isBefore(date, range.endDate))
  );
};

export const doDateRangesOverlap = (range1: DateRange, range2: DateRange): boolean => {
  return (
    isDateInRange(range1.startDate, range2) ||
    isDateInRange(range1.endDate, range2) ||
    isDateInRange(range2.startDate, range1) ||
    isDateInRange(range2.endDate, range1)
  );
};

export const isDateRangeAvailable = (
  targetRange: DateRange,
  existingBookings: Booking[]
): boolean => {
  return !existingBookings.some(booking =>
    booking.status === 'CONFIRMED' &&
    doDateRangesOverlap(
      targetRange,
      { startDate: booking.startDate, endDate: booking.endDate }
    )
  );
};

export const getOverlappingBookings = (
  targetRange: DateRange,
  existingBookings: Booking[]
): Booking[] => {
  return existingBookings.filter(booking =>
    booking.status === 'CONFIRMED' &&
    doDateRangesOverlap(
      targetRange,
      { startDate: booking.startDate, endDate: booking.endDate }
    )
  );
};

export const getAvailableDates = (
  startDate: Date,
  endDate: Date,
  existingBookings: Booking[]
): DateRange[] => {
  const availableRanges: DateRange[] = [];
  let currentDate = startOfDay(startDate);
  let rangeStart = currentDate;
  
  while (isBefore(currentDate, endDate)) {
    const isAvailable = isDateRangeAvailable(
      { startDate: currentDate, endDate: addDays(currentDate, 1) },
      existingBookings
    );
    
    if (!isAvailable && isSameDay(rangeStart, currentDate)) {
      currentDate = addDays(currentDate, 1);
      rangeStart = currentDate;
      continue;
    }
    
    if (!isAvailable) {
      if (!isSameDay(rangeStart, currentDate)) {
        availableRanges.push({
          startDate: rangeStart,
          endDate: currentDate
        });
      }
      currentDate = addDays(currentDate, 1);
      rangeStart = currentDate;
    } else {
      currentDate = addDays(currentDate, 1);
    }
  }
  
  if (!isSameDay(rangeStart, currentDate)) {
    availableRanges.push({
      startDate: rangeStart,
      endDate: currentDate
    });
  }
  
  return availableRanges;
};

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const days = differenceInDays(endDate, startDate);
  if (days === 0) return startDate.toLocaleDateString();
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} (${days} days)`;
}; 