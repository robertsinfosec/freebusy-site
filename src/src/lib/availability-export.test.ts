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

  it('includes a Generated line when generatedAtUtcMs is provided', () => {
    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T00:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: [{ dayOfWeek: 1, start: '09:00', end: '10:00' }],
      busy: [],
      window: null,
      generatedAtUtcMs: Date.parse('2025-12-29T12:34:56.000Z')
    })

    expect(text).toContain('Generated: 2025-12-29T12:34:56.000Z')
  })

  it('uses fallback working hours when weekly rules are missing', () => {
    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T00:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: null,
      busy: [],
      window: null
    })

    expect(text).toContain('Mon, Dec 29: 8 AM - 6 PM')
  })

  it('prints No availability when there is no working-hours rule for the day', () => {
    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T00:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: [{ dayOfWeek: 2, start: '09:00', end: '10:00' }],
      busy: [],
      window: null
    })

    expect(text).toContain('Mon, Dec 29: No availability')
  })

  it('prints No availability when a rule is malformed or collapses after rounding', () => {
    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T00:00:00.000Z')
    }

    const invalidTime = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: [{ dayOfWeek: 1, start: 'not-a-time', end: '10:00' }],
      busy: [],
      window: null
    })
    expect(invalidTime).toContain('Mon, Dec 29: No availability')

    const inverted = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: [{ dayOfWeek: 1, start: '10:00', end: '09:00' }],
      busy: [],
      window: null
    })
    expect(inverted).toContain('Mon, Dec 29: No availability')

    const collapsedByRounding = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone: 'Etc/UTC',
      viewTimeZone: 'Etc/UTC',
      workingHoursWeekly: [{ dayOfWeek: 1, start: '09:10', end: '09:20' }],
      busy: [],
      window: null
    })
    expect(collapsedByRounding).toContain('Mon, Dec 29: No availability')
  })

  it('treats all-day busy as blocking the entire working window', () => {
    const ownerTimeZone = 'Etc/UTC'
    const viewTimeZone = 'Etc/UTC'

    const ownerDay = {
      ownerDate: '2025-12-29',
      dayOfWeek: 1,
      startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
      endUtcMs: Date.parse('2025-12-30T00:00:00.000Z')
    }

    const text = buildAvailabilityExportText({
      ownerDays: [ownerDay],
      ownerTimeZone,
      viewTimeZone,
      workingHoursWeekly: [{ dayOfWeek: 1, start: '09:00', end: '10:00' }],
      busy: [
        {
          startUtcMs: Date.parse('2025-12-29T00:00:00.000Z'),
          endUtcMs: Date.parse('2025-12-29T23:59:00.000Z'),
          kind: 'allDay'
        }
      ],
      window: null
    })

    expect(text).toContain('Mon, Dec 29: No availability')
  })
})
