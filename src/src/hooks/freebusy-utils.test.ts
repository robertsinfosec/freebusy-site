import { describe, expect, it } from 'vitest'

import {
  FREEBUSY_DISABLED_MESSAGE,
  FREEBUSY_RATE_LIMITED_MESSAGE,
  FREEBUSY_UNAVAILABLE_MESSAGE,
  interpretFreeBusyHttpResult,
  buildOwnerDays,
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
})
