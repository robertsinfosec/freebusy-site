import { describe, expect, it } from 'vitest'

import {
  addDays,
  formatTime,
  formatTimeRange,
  getStartOfDay,
  getStartOfWeek,
  isSameDay,
  isWeekend,
  isWorkingHour
} from '@/lib/date-utils'

describe('date-utils', () => {
  it('getStartOfDay zeroes time', () => {
    const d = new Date('2025-12-27T15:04:05.123Z')
    const start = getStartOfDay(d)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  it('addDays adds calendar days', () => {
    const d = new Date('2025-12-27T00:00:00.000Z')
    expect(addDays(d, 2).toISOString().slice(0, 10)).toBe('2025-12-29')
  })

  it('getStartOfWeek returns Sunday start (current implementation)', () => {
    // 2025-12-27 is a Saturday
    const d = new Date('2025-12-27T12:00:00.000Z')
    const start = getStartOfWeek(d)
    // Sunday of that week is 2025-12-21
    expect(start.toISOString().slice(0, 10)).toBe('2025-12-21')
  })

  it('isSameDay matches year/month/day', () => {
    expect(isSameDay(new Date('2025-12-27T00:00:00Z'), new Date('2025-12-27T23:59:59Z'))).toBe(true)
    expect(isSameDay(new Date('2025-12-27T00:00:00Z'), new Date('2025-12-28T00:00:00Z'))).toBe(false)
  })

  it('isWeekend recognizes Saturday/Sunday', () => {
    expect(isWeekend(new Date('2025-12-27T12:00:00Z'))).toBe(true) // Sat
    expect(isWeekend(new Date('2025-12-28T12:00:00Z'))).toBe(true) // Sun
    expect(isWeekend(new Date('2025-12-29T12:00:00Z'))).toBe(false) // Mon
  })

  it('isWorkingHour is false on weekends', () => {
    expect(isWorkingHour(10, new Date('2025-12-27T12:00:00Z'))).toBe(false)
  })

  it('formatTime formats 0/12/13 correctly', () => {
    expect(formatTime(0)).toBe('12 AM')
    expect(formatTime(11)).toBe('11 AM')
    expect(formatTime(12)).toBe('12 PM')
    expect(formatTime(13)).toBe('1 PM')
  })

  it('formatTimeRange formats times with minutes', () => {
    const start = new Date('2025-12-27T13:00:00Z')
    const end = new Date('2025-12-27T14:30:00Z')
    const label = formatTimeRange(start, end)
    expect(label).toContain(' - ')
    expect(label.length).toBeGreaterThan(5)
  })
})
