import { describe, expect, it } from 'vitest'

import {
  buildScheduleByIsoWeekday,
  buildViewWorkIntervalsByOwnerDayIndex,
  getHourCellAvailability,
  getOwnerDayBusyIntervalRenderInfos,
  getHourSlots,
  getWorkHourBoundsInViewTimeZone
} from '@/components/calendar-grid-utils'
import { buildOwnerDays } from '@/hooks/freebusy-utils'
import { getTimeZoneParts } from '@/lib/date-utils'

describe('calendar-grid-utils', () => {
  it('getHourSlots returns a contiguous range', () => {
    expect(getHourSlots(8, 11)).toEqual([8, 9, 10])
  })

  it('buildScheduleByIsoWeekday parses weekly working hours and ignores invalid entries', () => {
    const schedule = buildScheduleByIsoWeekday([
      { dayOfWeek: 1, start: '09:00', end: '17:30' },
      { dayOfWeek: 2, start: 'xx:yy', end: '17:00' }
    ])

    expect(schedule.size).toBe(1)
    expect(schedule.get(1)).toEqual({ startMin: 9 * 60, endMin: 17 * 60 + 30 })
  })

  it('buildViewWorkIntervalsByOwnerDayIndex uses defaults when no working hours are provided', () => {
    const ownerDays = buildOwnerDays({ ownerTimeZone: 'UTC', startDate: '2025-12-27', endDateInclusive: '2025-12-28' })
    const schedule = buildScheduleByIsoWeekday(null)

    const intervals = buildViewWorkIntervalsByOwnerDayIndex({
      ownerDays,
      scheduleByIsoWeekday: schedule,
      ownerTimeZone: 'UTC',
      viewTimeZone: 'UTC',
      defaultViewStartHour: 8,
      defaultViewEndHour: 18
    })

    expect(intervals).toHaveLength(2)
    expect(intervals[0]).toEqual({ startMin: 8 * 60, endMin: 18 * 60 })
    expect(intervals[1]).toEqual({ startMin: 8 * 60, endMin: 18 * 60 })
  })

  it('buildViewWorkIntervalsByOwnerDayIndex maps owner working hours into viewer minutes-of-day', () => {
    const ownerDays = buildOwnerDays({ ownerTimeZone: 'UTC', startDate: '2025-12-29', endDateInclusive: '2025-12-30' })
    // 2025-12-29 is Monday (ISO 1), 2025-12-30 is Tuesday (ISO 2)
    const schedule = buildScheduleByIsoWeekday([
      { dayOfWeek: 1, start: '09:15', end: '17:00' }
    ])

    const intervals = buildViewWorkIntervalsByOwnerDayIndex({
      ownerDays,
      scheduleByIsoWeekday: schedule,
      ownerTimeZone: 'UTC',
      viewTimeZone: 'UTC',
      defaultViewStartHour: 8,
      defaultViewEndHour: 18
    })

    expect(intervals).toHaveLength(2)
    expect(intervals[0]).toEqual({ startMin: 9 * 60 + 15, endMin: 17 * 60 })
    expect(intervals[1]).toBeNull()
  })

  it('buildViewWorkIntervalsByOwnerDayIndex extends endMin past midnight when viewer mapping crosses midnight', () => {
    const [ownerDay] = buildOwnerDays({ ownerTimeZone: 'UTC', startDate: '2025-12-27', endDateInclusive: '2025-12-27' })
    const schedule = buildScheduleByIsoWeekday([
      // 06:00Z-08:00Z maps to 22:00-00:00 in America/Los_Angeles (crosses midnight).
      { dayOfWeek: ownerDay.dayOfWeek, start: '06:00', end: '08:00' }
    ])

    const [interval] = buildViewWorkIntervalsByOwnerDayIndex({
      ownerDays: [ownerDay],
      scheduleByIsoWeekday: schedule,
      ownerTimeZone: 'UTC',
      viewTimeZone: 'America/Los_Angeles',
      defaultViewStartHour: 8,
      defaultViewEndHour: 18
    })

    expect(interval).toBeTruthy()
    expect(interval!.startMin).toBe(22 * 60)
    expect(interval!.endMin).toBe(24 * 60)
  })

  it('getWorkHourBoundsInViewTimeZone expands the grid to fit the schedule', () => {
    const ownerDays = buildOwnerDays({ ownerTimeZone: 'UTC', startDate: '2025-12-29', endDateInclusive: '2025-12-30' })
    const schedule = buildScheduleByIsoWeekday([
      { dayOfWeek: 1, start: '07:30', end: '19:15' }
    ])

    const bounds = getWorkHourBoundsInViewTimeZone({
      ownerDays,
      scheduleByIsoWeekday: schedule,
      ownerTimeZone: 'UTC',
      viewTimeZone: 'UTC',
      defaultViewStartHour: 8,
      defaultViewEndHour: 18
    })

    expect(bounds).toEqual({ workStartHour: 7, workEndHour: 20 })
  })

  it('getHourCellAvailability returns none/full/partial correctly', () => {
    expect(getHourCellAvailability({ inWindow: false, interval: { startMin: 8 * 60, endMin: 9 * 60 }, hour: 8 })).toEqual({
      kind: 'none'
    })

    expect(getHourCellAvailability({ inWindow: true, interval: null, hour: 8 })).toEqual({ kind: 'none' })

    expect(getHourCellAvailability({ inWindow: true, interval: { startMin: 8 * 60, endMin: 9 * 60 }, hour: 8 })).toEqual({ kind: 'full' })

    expect(getHourCellAvailability({ inWindow: true, interval: { startMin: 8 * 60 + 15, endMin: 8 * 60 + 45 }, hour: 8 })).toEqual({
      kind: 'partial',
      topPct: 25,
      heightPct: 50
    })
  })

  it('clips blocks to working window and computes pixel positions', () => {
    const ownerDay = {
      ownerDate: '2025-12-27',
      dayOfWeek: 6,
      startUtcMs: Date.parse('2025-12-27T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-28T00:00:00.000Z')
    }

    const busy = [
      // Starts before working hours, ends during
      { startUtcMs: Date.parse('2025-12-27T07:00:00.000Z'), endUtcMs: Date.parse('2025-12-27T09:00:00.000Z'), kind: 'time' as const },
      // Starts during, ends after
      { startUtcMs: Date.parse('2025-12-27T17:30:00.000Z'), endUtcMs: Date.parse('2025-12-27T19:00:00.000Z'), kind: 'time' as const }
    ]

    const renderInfos = getOwnerDayBusyIntervalRenderInfos({
      ownerDay,
      busy,
      viewTimeZone: 'UTC',
      workStart: 8,
      workEnd: 18,
      cellHeight: 48
    })

    expect(renderInfos).toHaveLength(2)

    // Interval is clipped to the owner-day in UTC; view-window clipping affects pixels.
    expect(renderInfos[0].visibleStartUtcMs).toBe(Date.parse('2025-12-27T07:00:00.000Z'))
    expect(renderInfos[0].visibleEndUtcMs).toBe(Date.parse('2025-12-27T09:00:00.000Z'))
    expect(renderInfos[0].topPx).toBe(0)
    expect(renderInfos[0].heightPx).toBe(48)

    // Second interval is clipped to owner-day in UTC, then view-window clipped for pixels.
    expect(renderInfos[1].visibleStartUtcMs).toBe(Date.parse('2025-12-27T17:30:00.000Z'))
    expect(renderInfos[1].visibleEndUtcMs).toBe(Date.parse('2025-12-27T19:00:00.000Z'))
    expect(renderInfos[1].topPx).toBeCloseTo(9.5 * 48, 6)
    expect(renderInfos[1].heightPx).toBeCloseTo(0.5 * 48, 6)
  })

  it('treats all-day blocks as full working day', () => {
    const ownerDay = {
      ownerDate: '2025-12-27',
      dayOfWeek: 6,
      startUtcMs: Date.parse('2025-12-27T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-28T00:00:00.000Z')
    }

    const renderInfos = getOwnerDayBusyIntervalRenderInfos({
      ownerDay,
      busy: [{ startUtcMs: Date.parse('2025-12-27T00:00:00.000Z'), endUtcMs: Date.parse('2025-12-28T00:00:00.000Z'), kind: 'allDay' as const }],
      viewTimeZone: 'UTC',
      workStart: 8,
      workEnd: 18,
      cellHeight: 48
    })

    expect(renderInfos).toHaveLength(1)
    expect(renderInfos[0].topPx).toBe(0)
    expect(renderInfos[0].heightPx).toBe(10 * 48)
  })

  it('renders correct viewer-local times across DST in multiple viewer zones (March 2026)', () => {
    const [ownerDay] = buildOwnerDays({
      ownerTimeZone: 'America/New_York',
      startDate: '2026-03-08',
      endDateInclusive: '2026-03-08'
    })

    // Two instants around the US DST transition.
    const busy = [
      { startUtcMs: Date.parse('2026-03-08T06:30:00.000Z'), endUtcMs: Date.parse('2026-03-08T06:45:00.000Z'), kind: 'time' as const },
      { startUtcMs: Date.parse('2026-03-08T07:30:00.000Z'), endUtcMs: Date.parse('2026-03-08T07:45:00.000Z'), kind: 'time' as const }
    ]

    // Central viewer: 06:30Z => 00:30 (CST), 07:30Z => 01:30 (CST)
    const central = getOwnerDayBusyIntervalRenderInfos({
      ownerDay,
      busy,
      viewTimeZone: 'America/Chicago',
      workStart: 0,
      workEnd: 24,
      cellHeight: 60
    })

    expect(central).toHaveLength(2)

    const c0 = getTimeZoneParts(new Date(central[0].visibleStartUtcMs), 'America/Chicago')
    const c1 = getTimeZoneParts(new Date(central[1].visibleStartUtcMs), 'America/Chicago')
    expect({ h: c0.hour, m: c0.minute }).toEqual({ h: 0, m: 30 })
    expect({ h: c1.hour, m: c1.minute }).toEqual({ h: 1, m: 30 })

    // With cellHeight=60 and workStart=0, topPx equals minutes since 00:00.
    expect(central[0].topPx).toBeCloseTo(30, 6)
    expect(central[1].topPx).toBeCloseTo(90, 6)

    // Pacific viewer: 06:30Z => 22:30 (PST previous day), 07:30Z => 23:30
    const pacific = getOwnerDayBusyIntervalRenderInfos({
      ownerDay,
      busy,
      viewTimeZone: 'America/Los_Angeles',
      workStart: 0,
      workEnd: 24,
      cellHeight: 60
    })

    expect(pacific).toHaveLength(2)

    const p0 = getTimeZoneParts(new Date(pacific[0].visibleStartUtcMs), 'America/Los_Angeles')
    const p1 = getTimeZoneParts(new Date(pacific[1].visibleStartUtcMs), 'America/Los_Angeles')
    expect({ h: p0.hour, m: p0.minute }).toEqual({ h: 22, m: 30 })
    expect({ h: p1.hour, m: p1.minute }).toEqual({ h: 23, m: 30 })
    expect(pacific[0].topPx).toBeCloseTo(22 * 60 + 30, 6)
    expect(pacific[1].topPx).toBeCloseTo(23 * 60 + 30, 6)
  })
})
