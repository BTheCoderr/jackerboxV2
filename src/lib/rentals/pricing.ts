export type RentalRateUnit = 'hourly' | 'daily' | 'weekly';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function calculateRentalPrice(rate: number, start: Date, end: Date, type: RentalRateUnit): number {
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('Invalid rental price or duration');
  }
  const unit = type === 'hourly' ? HOUR : type === 'weekly' ? 7 * DAY : DAY;
  const total = Math.round(rate * Math.ceil(duration / unit) * 100) / 100;
  if (!Number.isFinite(total) || total <= 0) throw new Error('Invalid rental total');
  return total;
}

export function rentalDatesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}
