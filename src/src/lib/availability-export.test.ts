import { describe, expect, it } from 'vitest'

import { buildAvailabilityExportText } from '@/lib/availability-export'

describe('availability-export', () => {
  it('computes available windows and rounds busy outward to :00/:30', () => {
    // Owner is Eastern; viewer is also Eastern for a deterministic test.
    const ownerTimeZone = 'America/New_York'
    const viewTimeZone = 'America/New_York'

    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T05:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T05:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone,
      viewTimeZone,
      workingHoursWeekly: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
      busy: [
        // 10:10–10:50 should block 10:00–11:00 after rounding.
        { startUtcMs: Date.parse('2025-12-29T15:10:00.000Z'), endUtcMs: Date.parse('2025-12-29T15:50:00.000Z'), kind: 'time' }
      ],
      window: {
        startDate: '2025-12-29',
        endDateInclusive: '2025-12-29',
        startUtc: '2025-12-29T05:00:00.000Z',
        endUtcExclusive: '2025-12-30T05:00:00.000Z'
      }
    })

    expect(text).toContain('Availability (')
    expect(text).toContain('(America/New_York)')
    // Should show two windows: 9–10 and 11–5.
    expect(text).toContain('Mon, Dec 29: 9 AM - 10 AM; 11 AM - 5 PM')
  })

  it('rounds working hours to :00/:30 boundaries for exported windows', () => {
    const ownerTimeZone = 'America/New_York'
    const viewTimeZone = 'America/New_York'

    const ownerDay = {
      ownerDate: '2025-12-30',
      dayOfWeek: 2,
      startUtcMs: Date.parse('2025-12-30T05:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-31T05:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone,
      viewTimeZone,
      // 09:10–16:50 should become 09:30–16:30 after rounding.
      workingHoursWeekly: [{ dayOfWeek: 2, start: '09:10', end: '16:50' }],
      busy: [],
      window: {
        startDate: '2025-12-30',
        endDateInclusive: '2025-12-30',
        startUtc: '2025-12-30T05:00:00.000Z',
        endUtcExclusive: '2025-12-31T05:00:00.000Z'
      }
    })

    expect(text).toContain('Tue, Dec 30: 9:30 AM - 4:30 PM')
  })
})
