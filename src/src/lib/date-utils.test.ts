import { describe, expect, it } from 'vitest'

import {
  addDays,
  addDaysInTimeZone,
  formatTime,
  formatTimeRange,
  formatTimeRangeInTimeZone,
  getStartOfDay,
  getStartOfDayInTimeZone,
  getStartOfWeek,
  getStartOfWeekInTimeZone,
  getTimeZoneDisplayName,
  getTimeZoneOffsetMinutes,
  getTimeZoneParts,
  isWeekendInTimeZone,
  isSameUTCDay,
  isWeekend,
  isWorkingHour,
  makeDateInTimeZone
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

  it('isSameUTCDay matches year/month/day', () => {
    expect(isSameUTCDay(new Date('2025-12-27T00:00:00Z'), new Date('2025-12-27T23:59:59Z'))).toBe(true)
    expect(isSameUTCDay(new Date('2025-12-27T00:00:00Z'), new Date('2025-12-28T00:00:00Z'))).toBe(false)
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

  it('getTimeZoneOffsetMinutes returns expected offsets for America/New_York', () => {
    // Winter: EST (UTC-5)
    expect(getTimeZoneOffsetMinutes(new Date('2025-01-01T00:00:00Z'), 'America/New_York')).toBe(-300)
    // Summer: EDT (UTC-4)
    expect(getTimeZoneOffsetMinutes(new Date('2025-07-01T00:00:00Z'), 'America/New_York')).toBe(-240)
  })

  it('makeDateInTimeZone constructs the correct UTC instant', () => {
    const nyMidnight = makeDateInTimeZone({ year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, 'America/New_York')
    expect(nyMidnight.toISOString()).toBe('2025-01-01T05:00:00.000Z')

    const nySummerMidnight = makeDateInTimeZone({ year: 2025, month: 7, day: 1, hour: 0, minute: 0, second: 0 }, 'America/New_York')
    expect(nySummerMidnight.toISOString()).toBe('2025-07-01T04:00:00.000Z')
  })

  it('getTimeZoneParts returns stable numeric parts', () => {
    const p = getTimeZoneParts(new Date('2025-01-01T05:34:56Z'), 'America/New_York')
    // 05:34Z on Jan 1 is 00:34 in New York (EST)
    expect(p.year).toBe(2025)
    expect(p.month).toBe(1)
    expect(p.day).toBe(1)
    expect(p.hour).toBe(0)
    expect(p.minute).toBe(34)
  })

  it('getStartOfDayInTimeZone returns owner-midnight instant', () => {
    const d = new Date('2025-01-01T15:04:05Z')
    const start = getStartOfDayInTimeZone(d, 'America/New_York')
    // Owner day for 2025-01-01 in NY begins at 05:00Z (EST)
    expect(start.toISOString()).toBe('2025-01-01T05:00:00.000Z')
  })

  it('addDaysInTimeZone advances calendar days in the target timezone', () => {
    const start = makeDateInTimeZone({ year: 2025, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, 'America/New_York')
    const plusTwo = addDaysInTimeZone(start, 2, 'America/New_York')
    expect(plusTwo.toISOString()).toBe('2025-01-03T05:00:00.000Z')
  })

  it('getStartOfWeekInTimeZone returns Sunday-start (weekday 0) in the target timezone', () => {
    // 2025-01-01 is Wednesday; Sunday start in NY is 2024-12-29 00:00 NY
    const d = new Date('2025-01-01T12:00:00Z')
    const start = getStartOfWeekInTimeZone(d, 'America/New_York')
    expect(start.toISOString()).toBe('2024-12-29T05:00:00.000Z')
  })

  it('isWeekendInTimeZone evaluates weekend in the target timezone', () => {
    // 2025-01-04 is Saturday in NY
    expect(isWeekendInTimeZone(new Date('2025-01-04T12:00:00Z'), 'America/New_York')).toBe(true)
    // 2025-01-06 is Monday in NY
    expect(isWeekendInTimeZone(new Date('2025-01-06T12:00:00Z'), 'America/New_York')).toBe(false)
  })

  it('formatTimeRangeInTimeZone formats using viewer timezone parts', () => {
    const start = new Date('2025-01-01T05:00:00Z') // 12:00 AM EST
    const end = new Date('2025-01-01T06:30:00Z') // 1:30 AM EST
    expect(formatTimeRangeInTimeZone(start, end, 'America/New_York')).toBe('12 AM - 1:30 AM')
  })

  it('getTimeZoneDisplayName falls back to the timezone id when needed', () => {
    const name = getTimeZoneDisplayName(new Date('2025-01-01T00:00:00Z'), 'Etc/UTC', 'short')
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })
})
