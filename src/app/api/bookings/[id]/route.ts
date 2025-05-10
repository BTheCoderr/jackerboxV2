import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth/auth-utils';
import { 
  RentalStatus, 
  rentalStatusSchema, 
  isValidRentalTransition 
} from '@/lib/constants/rental';
import { 
  success, 
  handleApiError, 
  unauthorized, 
  notFound, 
  forbidden,
  badRequest
} from '@/lib/utils/api-response';
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { z } from "zod";

// GET endpoint to fetch a specific rental
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rental = await db.rental.findUnique({
      where: {
        id: params.id,
      },
      include: {
        Equipment: {
          include: {
            User_Equipment_owneridToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!rental) return notFound('Rental not found');
    return success(rental);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH endpoint to update rental status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedStatus = rentalStatusSchema.parse(body.status);

    // Get the rental with equipment details
    const rental = await db.rental.findUnique({
      where: { id: params.id },
      include: { Equipment: true },
    });

    if (!rental) return notFound('Rental not found');

    // Check if user has permission to update the rental
    const isOwner = rental.Equipment.ownerid === user.id;
    const isRenter = rental.renterid === user.id;
    
    if (!isOwner && !isRenter) {
      return forbidden('You do not have permission to update this rental');
    }

    // Validate status transition
    const isValidTransition = isValidRentalTransition(
      rental.status as RentalStatus,
      validatedStatus,
      isOwner
    );

    if (!isValidTransition) {
      return badRequest(
        isOwner
          ? 'Can only confirm or cancel pending rentals'
          : 'Renters can only cancel their rentals or mark them as completed'
      );
    }

    const updatedRental = await db.rental.update({
      where: { id: params.id },
      data: {
        status: {
          set: validatedStatus
        }
      },
      include: {
        Equipment: {
          include: {
            User_Equipment_owneridToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return success(updatedRental, 'Rental status updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE endpoint to delete a rental
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const rental = await db.rental.findUnique({
      where: { id: params.id },
      include: { Equipment: true },
    });

    if (!rental) return notFound('Rental not found');

    // Only allow deletion by the equipment owner or the renter
    const isOwner = rental.Equipment.ownerid === user.id;
    const isRenter = rental.renterid === user.id;
    
    if (!isOwner && !isRenter) {
      return forbidden('You do not have permission to delete this rental');
    }

    // Only allow deletion of pending or cancelled rentals
    if (rental.status !== RentalStatus.PENDING && rental.status !== RentalStatus.CANCELLED) {
      return badRequest('Can only delete pending or cancelled rentals');
    }

    await db.rental.delete({
      where: { id: params.id },
    });

    return success(null, 'Rental deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
} 