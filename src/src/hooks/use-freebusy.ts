import { useCallback, useEffect, useState } from 'react'

import {
  type FreeBusyResponseDto,
  FREEBUSY_UNAVAILABLE_MESSAGE,
  interpretFreeBusyHttpResult,
  buildOwnerDays,
  chunkOwnerDaysByWeekStart,
  parseBusyIntervals,
  type OwnerDay,
  type ParsedBusyInterval
} from '@/hooks/freebusy-utils'

type AvailabilityState = {
  busy: ParsedBusyInterval[]
  apiVersion: string | null
  loading: boolean
  disabledMessage: string | null
  unavailableMessage: string | null
  ownerTimeZone: string | null
  weekStartDay: number | null
  window: FreeBusyResponseDto['window'] | null
  ownerDays: OwnerDay[]
  ownerWeeks: OwnerDay[][]
  workingHours: FreeBusyResponseDto['workingHours'] | null
  rateLimitNextAllowedAtUtc: string | null
}

export function useFreeBusy() {
  const [state, setState] = useState<AvailabilityState>({
    busy: [],
    apiVersion: null,
    loading: true,
    disabledMessage: null,
    unavailableMessage: null,
    window: null,
    ownerTimeZone: null,
    weekStartDay: null,
    ownerDays: [],
    ownerWeeks: [],
    workingHours: null,
    rateLimitNextAllowedAtUtc: null
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
          busy: [],
          ownerTimeZone: null,
          weekStartDay: null,
          window: null,
          ownerDays: [],
          ownerWeeks: [],
          workingHours: null,
          rateLimitNextAllowedAtUtc: null
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
          busy: [],
          ownerTimeZone: null,
          weekStartDay: null,
          window: null,
          ownerDays: [],
          ownerWeeks: [],
          workingHours: null,
          rateLimitNextAllowedAtUtc: interpreted.rateLimit.nextAllowedAtUtc
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
          busy: [],
          ownerTimeZone: null,
          weekStartDay: null,
          window: null,
          ownerDays: [],
          ownerWeeks: [],
          workingHours: null,
          rateLimitNextAllowedAtUtc: null
        }))
        return
      }

      const data = body as FreeBusyResponseDto
      const ownerTimeZone = data.calendar?.timeZone ?? null
      const weekStartDay = data.calendar?.weekStartDay ?? null
      const ownerDays = ownerTimeZone
        ? buildOwnerDays({ ownerTimeZone, startDate: data.window.startDate, endDateInclusive: data.window.endDateInclusive })
        : []
      const ownerWeeks = weekStartDay
        ? chunkOwnerDaysByWeekStart({ ownerDays, weekStartDay })
        : [ownerDays]
      const busy = parseBusyIntervals(data.busy ?? [])

      setState({
        busy,
        apiVersion: data.version ?? null,
        loading: false,
        disabledMessage: null,
        unavailableMessage: null,
        window: data.window ?? null,
        ownerTimeZone,
        weekStartDay,
        ownerDays,
        ownerWeeks,
        workingHours: data.workingHours ?? null,
        rateLimitNextAllowedAtUtc: data.rateLimit?.nextAllowedAtUtc ?? null
      })
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        apiVersion: null,
        disabledMessage: null,
        unavailableMessage: FREEBUSY_UNAVAILABLE_MESSAGE,
        busy: [],
        ownerTimeZone: null,
        weekStartDay: null,
        window: null,
        ownerDays: [],
        ownerWeeks: [],
        workingHours: null,
        rateLimitNextAllowedAtUtc: null
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
    refreshDisabledUntil: state.rateLimitNextAllowedAtUtc
  }
}
