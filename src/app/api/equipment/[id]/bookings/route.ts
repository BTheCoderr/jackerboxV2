import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bookingDateSchema, calculateBookingPrice, BookingStatus } from '@/lib/constants/booking';
import { isDateRangeAvailable } from '@/lib/utils/date';
import { success, created, handleApiError, unauthorized, notFound, badRequest } from '@/lib/utils/api-response';
import { z } from 'zod';

// Schema for creating a booking
const createBookingSchema = bookingDateSchema.extend({
  equipmentId: z.string(),
});

// GET endpoint to fetch all bookings for a piece of equipment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookings = await db.booking.findMany({
      where: {
        equipmentId: params.id,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    return success(bookings);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST endpoint to create a new booking
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const validatedData = createBookingSchema.parse({
      ...body,
      equipmentId: params.id,
    });

    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: params.id },
    });

    if (!equipment) return notFound('Equipment not found');

    // Check if equipment is available for the selected dates
    const existingBookings = await db.booking.findMany({
      where: {
        equipmentId: params.id,
        status: BookingStatus.CONFIRMED,
      },
    });

    const isAvailable = isDateRangeAvailable(
      {
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
      },
      existingBookings
    );

    if (!isAvailable) {
      return badRequest('Equipment not available for selected dates');
    }

    // Calculate total price
    const totalPrice = calculateBookingPrice(
      equipment.dailyRate,
      validatedData.startDate,
      validatedData.endDate
    );

    // Create the booking
    const booking = await db.booking.create({
      data: {
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        equipmentId: params.id,
        renterId: user.id,
        totalPrice,
        status: BookingStatus.PENDING,
      },
    });

    return created(booking, 'Booking created successfully');
  } catch (error) {
    return handleApiError(error);
  }
} 