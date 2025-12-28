import { describe, expect, it } from 'vitest'

import { getDayBusyBlockRenderInfos, getHourSlots } from '@/components/calendar-grid-utils'

describe('calendar-grid-utils', () => {
  it('getHourSlots returns a contiguous range', () => {
    expect(getHourSlots(8, 11)).toEqual([8, 9, 10])
  })

  it('clips blocks to working window and computes pixel positions', () => {
    const date = new Date('2025-12-27T00:00:00Z')

    const blocks = [
      // Starts before working hours, ends during
      { start: new Date('2025-12-27T07:00:00Z'), end: new Date('2025-12-27T09:00:00Z'), isAllDay: false },
      // Starts during, ends after
      { start: new Date('2025-12-27T17:30:00Z'), end: new Date('2025-12-27T19:00:00Z'), isAllDay: false }
    ]

    const renderInfos = getDayBusyBlockRenderInfos({
      date,
      busyBlocks: blocks,
      workStart: 8,
      workEnd: 18,
      cellHeight: 48,
      timeZone: 'UTC',
      calendarTimeZone: 'UTC'
    })

    expect(renderInfos).toHaveLength(2)

    // First block is clipped to 08:00-09:00
    expect(renderInfos[0].visibleStart.toISOString()).toBe('2025-12-27T08:00:00.000Z')
    expect(renderInfos[0].visibleEnd.toISOString()).toBe('2025-12-27T09:00:00.000Z')
    expect(renderInfos[0].topPx).toBe(0)
    expect(renderInfos[0].heightPx).toBe(48)

    // Second block is clipped to 17:30-18:00
    expect(renderInfos[1].visibleStart.toISOString()).toBe('2025-12-27T17:30:00.000Z')
    expect(renderInfos[1].visibleEnd.toISOString()).toBe('2025-12-27T18:00:00.000Z')
    expect(renderInfos[1].topPx).toBeCloseTo(9.5 * 48, 6)
    expect(renderInfos[1].heightPx).toBeCloseTo(0.5 * 48, 6)
  })

  it('treats all-day blocks as full working day', () => {
    const date = new Date('2025-12-27T00:00:00Z')

    const renderInfos = getDayBusyBlockRenderInfos({
      date,
      busyBlocks: [{ start: new Date('2025-12-27T00:00:00Z'), end: new Date('2025-12-28T00:00:00Z'), isAllDay: true }],
      workStart: 8,
      workEnd: 18,
      cellHeight: 48,
      timeZone: 'UTC',
      calendarTimeZone: 'UTC'
    })

    expect(renderInfos).toHaveLength(1)
    expect(renderInfos[0].visibleStart.toISOString()).toBe('2025-12-27T08:00:00.000Z')
    expect(renderInfos[0].visibleEnd.toISOString()).toBe('2025-12-27T18:00:00.000Z')
    expect(renderInfos[0].topPx).toBe(0)
    expect(renderInfos[0].heightPx).toBe(10 * 48)
  })
})
