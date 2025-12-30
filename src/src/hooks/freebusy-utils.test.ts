import { describe, expect, it } from 'vitest'

import {
  FREEBUSY_DISABLED_MESSAGE,
  FREEBUSY_RATE_LIMITED_MESSAGE,
  FREEBUSY_UNAVAILABLE_MESSAGE,
  interpretFreeBusyHttpResult,
  buildOwnerDays,
  buildOwnerDaysForWindow,
  chunkOwnerDaysByWeekStart,
  parseBusyIntervals
} from '@/hooks/freebusy-utils'

describe('freebusy-utils', () => {
  it('parses busy intervals as canonical UTC instants', () => {
    const parsed = parseBusyIntervals([
      { startUtc: '2025-12-27T10:00:00.000Z', endUtc: '2025-12-27T11:00:00.000Z', kind: 'time' },
      { startUtc: 'bad', endUtc: '2025-12-27T12:00:00.000Z', kind: 'time' }
    ])

    expect(parsed).toHaveLength(1)
    expect(parsed[0].startUtcMs).toBe(Date.parse('2025-12-27T10:00:00.000Z'))
    expect(parsed[0].endUtcMs).toBe(Date.parse('2025-12-27T11:00:00.000Z'))
    expect(parsed[0].kind).toBe('time')
  })

  it('interprets 503 disabled', () => {
    const res = interpretFreeBusyHttpResult({
      status: 503,
      ok: false,
      body: { error: 'disabled' }
    })

    expect(res).toEqual({ kind: 'disabled', message: FREEBUSY_DISABLED_MESSAGE })
  })

  it('interprets 503 non-disabled as unavailable', () => {
    const res = interpretFreeBusyHttpResult({
      status: 503,
      ok: false,
      body: { error: 'something-else' }
    })

    expect(res).toEqual({ kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE })
  })

  it('interprets 502 upstream_error as unavailable', () => {
    const res = interpretFreeBusyHttpResult({
      status: 502,
      ok: false,
      body: { error: 'upstream_error' }
    })

    expect(res).toEqual({ kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE })
  })

  it('interprets 429 as unavailable', () => {
    const res = interpretFreeBusyHttpResult({
      status: 429,
      ok: false
    })

    expect(res.kind).toBe('unavailable')
  })

  it('interprets non-ok as unavailable', () => {
    const res = interpretFreeBusyHttpResult({
      status: 500,
      ok: false
    })

    expect(res).toEqual({ kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE })
  })

  it('interprets 429 rate_limited with rateLimit metadata', () => {
    const res = interpretFreeBusyHttpResult({
      status: 429,
      ok: false,
      body: {
        error: 'rate_limited',
        rateLimit: {
          nextAllowedAtUtc: '2025-12-27T12:05:00.000Z',
          scopes: {
            perIp: { remaining: 0, resetUtc: '2025-12-27T12:05:00.000Z', limit: 60, windowMs: 300000 }
          }
        }
      }
    })

    expect(res).toEqual({
      kind: 'rate_limited',
      message: FREEBUSY_RATE_LIMITED_MESSAGE,
      rateLimit: {
        nextAllowedAtUtc: '2025-12-27T12:05:00.000Z',
        scopes: {
          perIp: { remaining: 0, resetUtc: '2025-12-27T12:05:00.000Z', limit: 60, windowMs: 300000 }
        }
      }
    })
  })

  it('buildOwnerDays uses owner timezone boundaries across DST (America/New_York, March 2026)', () => {
    const days = buildOwnerDays({
      ownerTimeZone: 'America/New_York',
      startDate: '2026-03-07',
      endDateInclusive: '2026-03-09'
    })

    const dstDay = days.find(d => d.ownerDate === '2026-03-08')
    expect(dstDay).toBeTruthy()
    expect(dstDay!.dayOfWeek).toBe(7) // Sunday

    // Midnight-to-midnight owner day on DST start day is 23 hours.
    expect(dstDay!.startUtcMs).toBe(Date.parse('2026-03-08T05:00:00.000Z'))
    expect(dstDay!.endUtcMs).toBe(Date.parse('2026-03-09T04:00:00.000Z'))
  })

  it('chunks owner days on weekStartDay without inventing extra days', () => {
    const ownerDays = [
      { ownerDate: '2026-01-04', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }, // Sun
      { ownerDate: '2026-01-05', dayOfWeek: 1, startUtcMs: 1, endUtcMs: 2 }, // Mon
      { ownerDate: '2026-01-06', dayOfWeek: 2, startUtcMs: 2, endUtcMs: 3 }
    ]

    const weeks = chunkOwnerDaysByWeekStart({ ownerDays, weekStartDay: 1 })
    expect(weeks).toHaveLength(2)
    expect(weeks[0].map(d => d.ownerDate)).toEqual(['2026-01-04'])
    expect(weeks[1].map(d => d.ownerDate)).toEqual(['2026-01-05', '2026-01-06'])
  })

  it('pads owner days back to weekStartDay and marks them out-of-window', () => {
    const ownerDays = buildOwnerDaysForWindow({
      ownerTimeZone: 'America/New_York',
      startDate: '2025-12-29', // Monday
      endDateInclusive: '2026-01-04',
      weekStartDay: 7 // Sunday
    })

    // First visible date should be the Sunday before the window start.
    expect(ownerDays[0].ownerDate).toBe('2025-12-28')
    expect(ownerDays[0].dayOfWeek).toBe(7)
    expect(ownerDays[0].inWindow).toBe(false)

    const startDay = ownerDays.find(d => d.ownerDate === '2025-12-29')
    expect(startDay).toBeTruthy()
    expect(startDay!.inWindow).toBe(true)
  })

  it('pads owner days forward to the end of the week and marks them out-of-window', () => {
    // Mirrors the UI expectation: even if the window ends mid-week (e.g. Monday),
    // still render the full trailing week.
    const ownerDays = buildOwnerDaysForWindow({
      ownerTimeZone: 'America/New_York',
      startDate: '2025-12-30', // Tuesday
      endDateInclusive: '2026-01-19', // Monday
      weekStartDay: 7 // Sunday
    })

    // Should be padded through Saturday of that week.
    expect(ownerDays.at(-1)?.ownerDate).toBe('2026-01-24')

    const endDay = ownerDays.find(d => d.ownerDate === '2026-01-19')
    expect(endDay).toBeTruthy()
    expect(endDay!.inWindow).toBe(true)

    for (const ymd of ['2026-01-20', '2026-01-21', '2026-01-22', '2026-01-23', '2026-01-24']) {
      const d = ownerDays.find(x => x.ownerDate === ymd)
      expect(d).toBeTruthy()
      expect(d!.inWindow).toBe(false)
    }
  })
})
