import { z } from 'zod';

export enum RentalStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUNDED = 'REFUNDED'
}

export const rentalStatusSchema = z.nativeEnum(RentalStatus);

// Define valid status transitions
const ownerTransitions = {
  [RentalStatus.PENDING]: [RentalStatus.CONFIRMED, RentalStatus.CANCELLED],
  [RentalStatus.CONFIRMED]: [RentalStatus.IN_PROGRESS, RentalStatus.CANCELLED],
  [RentalStatus.IN_PROGRESS]: [RentalStatus.COMPLETED, RentalStatus.DISPUTED],
  [RentalStatus.COMPLETED]: [],
  [RentalStatus.CANCELLED]: [],
  [RentalStatus.DISPUTED]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED],
  [RentalStatus.PAID]: [],
  [RentalStatus.PAYMENT_FAILED]: [],
  [RentalStatus.REFUNDED]: []
};

const renterTransitions = {
  [RentalStatus.PENDING]: [RentalStatus.CANCELLED],
  [RentalStatus.CONFIRMED]: [RentalStatus.CANCELLED],
  [RentalStatus.IN_PROGRESS]: [RentalStatus.COMPLETED, RentalStatus.DISPUTED],
  [RentalStatus.COMPLETED]: [],
  [RentalStatus.CANCELLED]: [],
  [RentalStatus.DISPUTED]: [],
  [RentalStatus.PAID]: [],
  [RentalStatus.PAYMENT_FAILED]: [],
  [RentalStatus.REFUNDED]: []
};

export function isValidRentalTransition(
  currentStatus: RentalStatus,
  newStatus: RentalStatus,
  isOwner: boolean
): boolean {
  const validTransitions = isOwner ? ownerTransitions : renterTransitions;
  return validTransitions[currentStatus]?.includes(newStatus) || false;
} 