import { mergeBusyBlocks, type BusyBlock } from '@/lib/ical-parser'
import { getTimeZoneParts } from '@/lib/date-utils'

export interface BusyIntervalDto {
  start: string
  end: string
}

export interface WindowDto {
  start: string
  end: string
}

export interface WorkingScheduleDayRuleDto {
  // 0=Sun ... 6=Sat
  dayOfWeek: number
  // Local time in workingSchedule.timeZone
  start: string // HH:mm
  end: string // HH:mm
}

export interface WorkingScheduleDto {
  timeZone: string
  weekly: WorkingScheduleDayRuleDto[]
}

export interface RateLimitScopeStateDto {
  remaining: number
  reset: string
  limit: number
  windowMs: number
}

export interface RateLimitStateDto {
  nextAllowedAt: string
  scopes: Record<string, RateLimitScopeStateDto>
}

export interface FreeBusyResponseDto {
  version: string
  generatedAt: string
  window: WindowDto
  timezone: string
  workingSchedule?: WorkingScheduleDto
  busy: BusyIntervalDto[]
  rateLimit?: RateLimitStateDto
}

export interface ErrorResponseDto {
  error:
    | 'forbidden_origin'
    | 'rate_limited'
    | 'upstream'
    | 'parse'
    | 'disabled'
    | 'misconfigured'
    | 'not_found'
}

export interface RateLimitedErrorResponseDto extends ErrorResponseDto {
  rateLimit: RateLimitStateDto
}

export const FREEBUSY_DISABLED_MESSAGE = 'Free/busy time is not being shared right now.'
export const FREEBUSY_UNAVAILABLE_MESSAGE = 'There was a problem getting availability. Please try again later.'
export const FREEBUSY_RATE_LIMITED_MESSAGE = 'Rate limited. Please wait before refreshing.'

export type AvailabilityResult =
  | { kind: 'ok' }
  | { kind: 'disabled'; message: string }
  | { kind: 'rate_limited'; message: string; rateLimit: RateLimitStateDto }
  | { kind: 'unavailable'; message: string }

function isAllDayInTimeZone(start: Date, end: Date, timeZone: string): boolean {
  const startParts = getTimeZoneParts(start, timeZone)
  const endMinusOne = new Date(end.getTime() - 1)
  const endParts = getTimeZoneParts(endMinusOne, timeZone)

  const startIsMidnight = startParts.hour === 0 && startParts.minute === 0 && startParts.second === 0
  const endIsEndOfDay = endParts.hour === 23 && endParts.minute === 59

  return startIsMidnight && endIsEndOfDay
}

export function mapFreeBusyResponseToBusyBlocks(
  data: Pick<FreeBusyResponseDto, 'busy' | 'timezone'>
): BusyBlock[] {
  const events: BusyBlock[] = data.busy.map(item => ({
    start: new Date(item.start),
    end: new Date(item.end),
    isAllDay: false,
    _rawStart: item.start,
    _rawEnd: item.end
  }))

  for (const event of events) {
    if (isAllDayInTimeZone(event.start, event.end, data.timezone)) {
      event.isAllDay = true
    }
  }

  return mergeBusyBlocks(events)
}

export function interpretFreeBusyHttpResult(args: {
  status: number
  ok: boolean
  body?: unknown
}): AvailabilityResult {
  const { status, ok, body } = args

  const errorCode = typeof body === 'object' && body !== null && 'error' in body
    ? (body as { error?: unknown }).error
    : undefined

  if (status === 503) {
    if (errorCode === 'disabled') {
      return { kind: 'disabled', message: FREEBUSY_DISABLED_MESSAGE }
    }

    return { kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE }
  }

  if (status === 429 || errorCode === 'rate_limited') {
    const rateLimit = typeof body === 'object' && body !== null && 'rateLimit' in body
      ? (body as { rateLimit?: unknown }).rateLimit
      : undefined

    if (
      typeof rateLimit === 'object' &&
      rateLimit !== null &&
      'nextAllowedAt' in rateLimit &&
      'scopes' in rateLimit
    ) {
      return {
        kind: 'rate_limited',
        message: FREEBUSY_RATE_LIMITED_MESSAGE,
        rateLimit: rateLimit as RateLimitStateDto
      }
    }

    return { kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE }
  }

  if (!ok) {
    return { kind: 'unavailable', message: FREEBUSY_UNAVAILABLE_MESSAGE }
  }

  return { kind: 'ok' }
}

export function getWindowWeeks(window: WindowDto): number {
  const start = new Date(window.start)
  const end = new Date(window.end)
  const msPerDay = 24 * 60 * 60 * 1000

  // Inclusive end (API specifies end is last millisecond of last day)
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime() + 1) / msPerDay))
  return Math.max(1, Math.ceil(days / 7))
}
