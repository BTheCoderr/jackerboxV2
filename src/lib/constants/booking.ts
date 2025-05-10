import { z } from 'zod';

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

export const bookingStatusSchema = z.enum([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
]);

export const bookingDateSchema = z.object({
  startDate: z.string().or(z.date()).transform(val => new Date(val)),
  endDate: z.string().or(z.date()).transform(val => new Date(val)),
}).refine(
  ({ startDate, endDate }) => endDate > startDate,
  { message: "End date must be after start date" }
).refine(
  ({ startDate }) => startDate >= new Date(new Date().setHours(0, 0, 0, 0)),
  { message: "Start date must be today or later" }
);

export const isValidBookingTransition = (
  currentStatus: BookingStatusType,
  newStatus: BookingStatusType,
  isOwner: boolean
): boolean => {
  if (isOwner) {
    // Owner can only confirm or cancel pending bookings
    if (currentStatus === BookingStatus.PENDING) {
      return [BookingStatus.CONFIRMED, BookingStatus.CANCELLED].includes(newStatus);
    }
    return false;
  } else {
    // Renter can only cancel their bookings or mark them as completed
    return [BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(newStatus);
  }
};

export const getBookingDuration = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculateBookingPrice = (dailyRate: number, startDate: Date, endDate: Date): number => {
  const duration = getBookingDuration(startDate, endDate);
  return duration * dailyRate;
}; 