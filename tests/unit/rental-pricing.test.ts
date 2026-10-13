import { calculateRentalPrice, rentalDatesOverlap } from '../../src/lib/rentals/pricing';

const t = (iso: string) => new Date(iso);

describe('JackerBox actual rental pricing', () => {
  test('hourly pricing rounds partial hours up', () => {
    expect(calculateRentalPrice(25, t('2026-10-11T10:00:00Z'), t('2026-10-11T12:30:00Z'), 'hourly')).toBe(75);
  });
  test('daily pricing respects exact full days', () => {
    expect(calculateRentalPrice(150, t('2026-10-11T00:00:00Z'), t('2026-10-14T00:00:00Z'), 'daily')).toBe(450);
  });
  test('weekly pricing rounds partial weeks up', () => {
    expect(calculateRentalPrice(800, t('2026-10-11T00:00:00Z'), t('2026-10-26T00:00:00Z'), 'weekly')).toBe(2400);
  });
  test('rejects negative or zero rates and reversed date range', () => {
    expect(() => calculateRentalPrice(-1, t('2026-10-11'), t('2026-10-12'), 'daily')).toThrow();
    expect(() => calculateRentalPrice(50, t('2026-10-12'), t('2026-10-11'), 'daily')).toThrow();
  });
  test('two rental windows overlapping are rejected', () => {
    expect(rentalDatesOverlap(t('2026-10-11'), t('2026-10-13'), t('2026-10-12'), t('2026-10-14'))).toBe(true);
  });
  test('back-to-back rentals do not overlap', () => {
    expect(rentalDatesOverlap(t('2026-10-11'), t('2026-10-13'), t('2026-10-13'), t('2026-10-15'))).toBe(false);
  });
});
