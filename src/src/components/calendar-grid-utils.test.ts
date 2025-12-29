import { describe, expect, it } from 'vitest'

import { getOwnerDayBusyIntervalRenderInfos, getHourSlots } from '@/components/calendar-grid-utils'
import { buildOwnerDays } from '@/hooks/freebusy-utils'
import { getTimeZoneParts } from '@/lib/date-utils'

describe('calendar-grid-utils', () => {
  it('getHourSlots returns a contiguous range', () => {
    expect(getHourSlots(8, 11)).toEqual([8, 9, 10])
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
