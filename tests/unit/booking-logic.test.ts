import { describe, expect, test } from '@jest/globals'

// Mock booking logic functions
const checkBookingOverlap = (
  existingBookings: Array<{startDate: Date, endDate: Date}>,
  newStart: Date,
  newEnd: Date
): boolean => {
  return existingBookings.some(booking => {
    return (newStart < booking.endDate && newEnd > booking.startDate)
  })
}

const calculatePrice = (
  hourlyRate: number,
  dailyRate: number,
  weeklyRate: number,
  startDate: Date,
  endDate: Date,
  rentalType: 'hourly' | 'daily' | 'weekly' = 'daily'
): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.ceil(diffDays / 7)

  switch (rentalType) {
    case 'hourly':
      return hourlyRate * diffHours
    case 'weekly':
      return weeklyRate * diffWeeks
    case 'daily':
    default:
      return dailyRate * diffDays
  }
}

const calculateSecurityDeposit = (totalPrice: number): number => {
  // Security deposit is 20% of total price, minimum $50, maximum $500
  const deposit = Math.max(50, Math.min(500, totalPrice * 0.2))
  return Math.round(deposit * 100) / 100 // Round to 2 decimal places
}

describe('Booking Overlap Logic', () => {
  test('should detect overlapping bookings', () => {
    const existingBookings = [
      {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-03')
      },
      {
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-12')
      }
    ]

    // Test overlap at start
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-04-30'),
      new Date('2025-05-02')
    )).toBe(true)

    // Test overlap at end
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-05-02'),
      new Date('2025-05-04')
    )).toBe(true)

    // Test complete overlap
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-04-30'),
      new Date('2025-05-15')
    )).toBe(true)

    // Test no overlap
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-05-05'),
      new Date('2025-05-08')
    )).toBe(false)
  })

  test('should allow adjacent bookings (no overlap)', () => {
    const existingBookings = [
      {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-03')
      }
    ]

    // Booking starts when previous ends
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-05-03'),
      new Date('2025-05-05')
    )).toBe(false)

    // Booking ends when next starts
    expect(checkBookingOverlap(
      existingBookings,
      new Date('2025-04-28'),
      new Date('2025-05-01')
    )).toBe(false)
  })
})

describe('Price Calculation Logic', () => {
  const hourlyRate = 25
  const dailyRate = 150
  const weeklyRate = 800

  test('should calculate hourly prices correctly', () => {
    const startDate = new Date('2025-05-01T10:00:00')
    const endDate = new Date('2025-05-01T14:00:00') // 4 hours

    const price = calculatePrice(hourlyRate, dailyRate, weeklyRate, startDate, endDate, 'hourly')
    expect(price).toBe(100) // 25 * 4 hours
  })

  test('should calculate daily prices correctly', () => {
    const startDate = new Date('2025-05-01')
    const endDate = new Date('2025-05-04') // 3 days

    const price = calculatePrice(hourlyRate, dailyRate, weeklyRate, startDate, endDate, 'daily')
    expect(price).toBe(450) // 150 * 3 days
  })

  test('should calculate weekly prices correctly', () => {
    const startDate = new Date('2025-05-01')
    const endDate = new Date('2025-05-15') // 2 weeks

    const price = calculatePrice(hourlyRate, dailyRate, weeklyRate, startDate, endDate, 'weekly')
    expect(price).toBe(1600) // 800 * 2 weeks
  })

  test('should handle partial time periods', () => {
    const startDate = new Date('2025-05-01T10:00:00')
    const endDate = new Date('2025-05-01T12:30:00') // 2.5 hours, should round up to 3

    const price = calculatePrice(hourlyRate, dailyRate, weeklyRate, startDate, endDate, 'hourly')
    expect(price).toBe(75) // 25 * 3 hours (rounded up)
  })
})

describe('Security Deposit Logic', () => {
  test('should calculate 20% of price within bounds', () => {
    expect(calculateSecurityDeposit(1000)).toBe(200) // 20% of 1000
    expect(calculateSecurityDeposit(500)).toBe(100)  // 20% of 500
  })

  test('should enforce minimum deposit of $50', () => {
    expect(calculateSecurityDeposit(100)).toBe(50)  // Would be $20, but min is $50
    expect(calculateSecurityDeposit(200)).toBe(50)  // Would be $40, but min is $50
  })

  test('should enforce maximum deposit of $500', () => {
    expect(calculateSecurityDeposit(5000)).toBe(500) // Would be $1000, but max is $500
    expect(calculateSecurityDeposit(10000)).toBe(500) // Would be $2000, but max is $500
  })

  test('should round to 2 decimal places', () => {
    expect(calculateSecurityDeposit(333)).toBe(66.6) // 20% of 333 = 66.6
  })
}) 