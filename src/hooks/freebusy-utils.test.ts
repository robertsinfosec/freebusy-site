import { describe, expect, it } from 'vitest'

import {
  FREEBUSY_DISABLED_MESSAGE,
  FREEBUSY_RATE_LIMITED_MESSAGE,
  FREEBUSY_UNAVAILABLE_MESSAGE,
  interpretFreeBusyHttpResult,
  getWindowWeeks,
  mapFreeBusyResponseToBusyBlocks
} from '@/hooks/freebusy-utils'

describe('freebusy-utils', () => {
  it('maps busy ranges into BusyBlocks and merges overlaps', () => {
    const blocks = mapFreeBusyResponseToBusyBlocks({
      busy: [
        { start: '2025-12-27T10:00:00.000Z', end: '2025-12-27T11:00:00.000Z' },
        { start: '2025-12-27T10:30:00.000Z', end: '2025-12-27T12:00:00.000Z' }
      ]
    })

    expect(blocks).toHaveLength(1)
    expect(blocks[0].start.toISOString()).toBe('2025-12-27T10:00:00.000Z')
    expect(blocks[0].end.toISOString()).toBe('2025-12-27T12:00:00.000Z')
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
          nextAllowedAt: '2025-12-27T12:05:00.000Z',
          scopes: {
            perIp: { remaining: 0, reset: '2025-12-27T12:05:00.000Z', limit: 60, windowMs: 300000 }
          }
        }
      }
    })

    expect(res).toEqual({
      kind: 'rate_limited',
      message: FREEBUSY_RATE_LIMITED_MESSAGE,
      rateLimit: {
        nextAllowedAt: '2025-12-27T12:05:00.000Z',
        scopes: {
          perIp: { remaining: 0, reset: '2025-12-27T12:05:00.000Z', limit: 60, windowMs: 300000 }
        }
      }
    })
  })

  it('computes window weeks from start/end', () => {
    expect(getWindowWeeks({ start: '2025-12-27T00:00:00.000Z', end: '2026-01-09T23:59:59.999Z' })).toBe(2)
  })
})
