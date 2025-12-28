import { useCallback, useEffect, useState } from 'react'

import type { BusyBlock } from '@/lib/ical-parser'
import {
  type FreeBusyResponseDto,
  FREEBUSY_UNAVAILABLE_MESSAGE,
  interpretFreeBusyHttpResult,
  getWindowWeeks,
  mapFreeBusyResponseToBusyBlocks
} from '@/hooks/freebusy-utils'

type AvailabilityState = {
  busyBlocks: BusyBlock[]
  apiVersion: string | null
  loading: boolean
  disabledMessage: string | null
  unavailableMessage: string | null
  windowWeeks: number | null
  window: { start: string; end: string } | null
  timezone: string | null
  workingSchedule: FreeBusyResponseDto['workingSchedule'] | null
  rateLimitNextAllowedAt: string | null
}

export function useFreeBusy() {
  const [state, setState] = useState<AvailabilityState>({
    busyBlocks: [],
    apiVersion: null,
    loading: true,
    disabledMessage: null,
    unavailableMessage: null,
    windowWeeks: null,
    window: null,
    timezone: null,
    workingSchedule: null,
    rateLimitNextAllowedAt: null
  })

  const fetchCalendar = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const apiUrl = import.meta.env.VITE_FREEBUSY_API || 'http://localhost:8787/freebusy'

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      })

      const body = await response.json().catch(() => undefined)
      const interpreted = interpretFreeBusyHttpResult({ status: response.status, ok: response.ok, body })

      if (interpreted.kind === 'disabled') {
        setState(prev => ({
          ...prev,
          loading: false,
          apiVersion: null,
          disabledMessage: interpreted.message,
          unavailableMessage: null,
          busyBlocks: [],
          timezone: null,
          workingSchedule: null,
          rateLimitNextAllowedAt: null
        }))
        return
      }

      if (interpreted.kind === 'rate_limited') {
        setState(prev => ({
          ...prev,
          loading: false,
          apiVersion: null,
          disabledMessage: null,
          unavailableMessage: interpreted.message,
          busyBlocks: [],
          timezone: null,
          workingSchedule: null,
          rateLimitNextAllowedAt: interpreted.rateLimit.nextAllowedAt
        }))
        return
      }

      if (interpreted.kind === 'unavailable') {
        setState(prev => ({
          ...prev,
          loading: false,
          apiVersion: null,
          disabledMessage: null,
          unavailableMessage: interpreted.message,
          busyBlocks: [],
          timezone: null,
          workingSchedule: null,
          rateLimitNextAllowedAt: null
        }))
        return
      }

      const data = body as FreeBusyResponseDto
      const merged = mapFreeBusyResponseToBusyBlocks(data)
      const windowWeeks = data.window ? getWindowWeeks(data.window) : null

      setState({
        busyBlocks: merged,
        apiVersion: data.version ?? null,
        loading: false,
        disabledMessage: null,
        unavailableMessage: null,
        windowWeeks,
        window: data.window ?? null,
        timezone: data.timezone ?? null,
        workingSchedule: data.workingSchedule ?? null,
        rateLimitNextAllowedAt: data.rateLimit?.nextAllowedAt ?? null
      })
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        apiVersion: null,
        disabledMessage: null,
        unavailableMessage: FREEBUSY_UNAVAILABLE_MESSAGE,
        busyBlocks: [],
        timezone: null,
        workingSchedule: null,
        rateLimitNextAllowedAt: null
      }))
    }
  }, [])

  useEffect(() => {
    fetchCalendar()

    const interval = setInterval(fetchCalendar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchCalendar])

  return {
    ...state,
    refresh: fetchCalendar,
    refreshDisabledUntil: state.rateLimitNextAllowedAt
  }
}
