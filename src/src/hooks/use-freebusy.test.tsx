import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useFreeBusy } from '@/hooks/use-freebusy'

function mockFetchOnce(value: { status: number; ok: boolean; body?: unknown }) {
  const json = vi.fn(async () => value.body)
  const response = {
    status: value.status,
    ok: value.ok,
    json
  } as unknown as Response

  ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response)
}

describe('useFreeBusy', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('fetches on mount and populates v2 state on success', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      body: {
        version: '25.1227.1200',
        generatedAtUtc: '2025-12-27T12:00:00.000Z',
        calendar: { timeZone: 'Etc/UTC', weekStartDay: 1 },
        window: {
          startDate: '2025-12-27',
          endDateInclusive: '2026-01-09',
          startUtc: '2025-12-27T00:00:00.000Z',
          endUtcExclusive: '2026-01-10T00:00:00.000Z'
        },
        workingHours: { weekly: [] },
        busy: [{ startUtc: '2025-12-27T10:00:00.000Z', endUtc: '2025-12-27T11:00:00.000Z', kind: 'time' }],
        rateLimit: {
          nextAllowedAtUtc: '2025-12-27T12:05:00.000Z',
          scopes: {
            perIp: { remaining: 59, resetUtc: '2025-12-27T12:05:00.000Z', limit: 60, windowMs: 300000 }
          }
        }
      }
    })

    const { result, unmount } = renderHook(() => useFreeBusy())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.unavailableMessage).toBeNull()
    expect(result.current.disabledMessage).toBeNull()
    expect(result.current.busy).toHaveLength(1)
    expect(result.current.ownerTimeZone).toBe('Etc/UTC')
    expect(result.current.ownerDays.length).toBeGreaterThan(0)
    expect(result.current.ownerWeeks.length).toBeGreaterThan(0)
    expect(result.current.rateLimitNextAllowedAtUtc).toBe('2025-12-27T12:05:00.000Z')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('sets disabledMessage when API returns 503 disabled', async () => {
    mockFetchOnce({
      status: 503,
      ok: false,
      body: { error: 'disabled' }
    })

    const { result, unmount } = renderHook(() => useFreeBusy())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.disabledMessage).toMatch(/not being shared/i)
    expect(result.current.unavailableMessage).toBeNull()
    expect(result.current.busy).toHaveLength(0)

    unmount()
  })

  it('auto-refreshes every 5 minutes', async () => {
    vi.useFakeTimers()

    mockFetchOnce({
      status: 200,
      ok: true,
      body: {
        version: '25.1227.1200',
        generatedAtUtc: '2025-12-27T12:00:00.000Z',
        calendar: { timeZone: 'Etc/UTC', weekStartDay: 1 },
        window: {
          startDate: '2025-12-27',
          endDateInclusive: '2026-01-09',
          startUtc: '2025-12-27T00:00:00.000Z',
          endUtcExclusive: '2026-01-10T00:00:00.000Z'
        },
        workingHours: { weekly: [] },
        busy: []
      }
    })
    mockFetchOnce({
      status: 200,
      ok: true,
      body: {
        version: '25.1227.1200',
        generatedAtUtc: '2025-12-27T12:05:00.000Z',
        calendar: { timeZone: 'Etc/UTC', weekStartDay: 1 },
        window: {
          startDate: '2025-12-27',
          endDateInclusive: '2026-01-09',
          startUtc: '2025-12-27T00:00:00.000Z',
          endUtcExclusive: '2026-01-10T00:00:00.000Z'
        },
        workingHours: { weekly: [] },
        busy: [{ startUtc: '2025-12-27T12:00:00.000Z', endUtc: '2025-12-27T12:30:00.000Z', kind: 'time' }]
      }
    })

    const { result, unmount } = renderHook(() => useFreeBusy())

    // Let the initial fetch promise resolve and React commit state.
    await act(async () => {
      await Promise.resolve()
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    // Let the interval-triggered fetch resolve.
    await act(async () => {
      await Promise.resolve()
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(result.current.busy).toHaveLength(1)

    unmount()
  })

  it('pads the first week back to weekStartDay and marks pre-window days out-of-window', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      body: {
        version: '25.1229.1650',
        generatedAtUtc: '2025-12-29T16:53:43.718Z',
        calendar: { timeZone: 'America/New_York', weekStartDay: 7 },
        window: {
          startDate: '2025-12-29',
          endDateInclusive: '2026-01-25',
          startUtc: '2025-12-29T05:00:00.000Z',
          endUtcExclusive: '2026-01-26T05:00:00.000Z'
        },
        workingHours: { weekly: [] },
        busy: []
      }
    })

    const { result, unmount } = renderHook(() => useFreeBusy())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.weekStartDay).toBe(7)
    expect(result.current.ownerWeeks.length).toBeGreaterThan(0)
    expect(result.current.ownerWeeks[0][0].ownerDate).toBe('2025-12-28')
    expect(result.current.ownerWeeks[0][0].inWindow).toBe(false)

    unmount()
  })
})
