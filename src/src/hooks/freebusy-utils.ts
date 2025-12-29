import { getTimeZoneIsoWeekday, makeDateInTimeZone } from '@/lib/date-utils'

export type BusyKindDto = 'time' | 'allDay'

export interface BusyIntervalDto {
  startUtc: string
  endUtc: string
  kind: BusyKindDto
}

export interface CalendarContextDto {
  timeZone: string
  weekStartDay: number // 1=Mon ... 7=Sun
}

export interface WindowDto {
  // Owner-local dates
  startDate: string // YYYY-MM-DD
  endDateInclusive: string // YYYY-MM-DD
  // UTC instants
  startUtc: string
  endUtcExclusive: string
}

export interface WorkingHoursDayRuleDto {
  // 1=Mon ... 7=Sun
  dayOfWeek: number
  // Local time in calendar.timeZone
  start: string // HH:mm
  end: string // HH:mm
}

export interface WorkingHoursDto {
  weekly: WorkingHoursDayRuleDto[]
}

export interface RateLimitScopeStateDto {
  remaining: number
  resetUtc: string
  limit: number
  windowMs: number
}

export interface RateLimitStateDto {
  nextAllowedAtUtc: string
  scopes: Record<string, RateLimitScopeStateDto>
}

export interface FreeBusyResponseDto {
  version: string
  generatedAtUtc: string
  calendar: CalendarContextDto
  window: WindowDto
  workingHours: WorkingHoursDto
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

export type ParsedBusyInterval = {
  startUtcMs: number
  endUtcMs: number
  kind: BusyKindDto
  _rawStartUtc?: string
  _rawEndUtc?: string
}

export type OwnerDay = {
  ownerDate: string // YYYY-MM-DD
  dayOfWeek: number // 1=Mon ... 7=Sun
  startUtcMs: number
  endUtcMs: number
  inWindow?: boolean
}

function parseIsoUtcToMs(value: string): number | null {
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return ms
}

function parseYmd(date: string): { year: number; month: number; day: number } | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return { year, month, day }
}

function addDaysToYmd(date: string, days: number): string {
  const p = parseYmd(date)
  if (!p) return date
  const utc = new Date(Date.UTC(p.year, p.month - 1, p.day + days, 12, 0, 0, 0))
  const y = utc.getUTCFullYear()
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function buildOwnerDays(args: {
  ownerTimeZone: string
  startDate: string
  endDateInclusive: string
}): OwnerDay[] {
  const { ownerTimeZone, startDate, endDateInclusive } = args

  const days: OwnerDay[] = []
  let cursor = startDate

  // Safety valve: prevent accidental infinite loops.
  for (let i = 0; i < 400; i++) {
    const ymd = parseYmd(cursor)
    if (!ymd) break

    const start = makeDateInTimeZone({ year: ymd.year, month: ymd.month, day: ymd.day, hour: 0, minute: 0, second: 0 }, ownerTimeZone)
    const nextDate = addDaysToYmd(cursor, 1)
    const nextYmd = parseYmd(nextDate)
    if (!nextYmd) break
    const end = makeDateInTimeZone({ year: nextYmd.year, month: nextYmd.month, day: nextYmd.day, hour: 0, minute: 0, second: 0 }, ownerTimeZone)

    days.push({
      ownerDate: cursor,
      dayOfWeek: getTimeZoneIsoWeekday(start, ownerTimeZone),
      startUtcMs: start.getTime(),
      endUtcMs: end.getTime()
    })

    if (cursor === endDateInclusive) break
    cursor = nextDate
  }

  return days
}

export function buildOwnerDaysForWindow(args: {
  ownerTimeZone: string
  startDate: string
  endDateInclusive: string
  weekStartDay?: number | null
}): OwnerDay[] {
  const { ownerTimeZone, startDate, endDateInclusive, weekStartDay } = args

  const windowDays = buildOwnerDays({ ownerTimeZone, startDate, endDateInclusive }).map(d => ({ ...d, inWindow: true }))
  if (!weekStartDay || windowDays.length === 0) return windowDays

  const first = windowDays[0]
  if (first.dayOfWeek === weekStartDay) return windowDays

  const daysBack = (first.dayOfWeek + 7 - weekStartDay) % 7
  if (daysBack <= 0) return windowDays

  const paddedStart = addDaysToYmd(startDate, -daysBack)
  const paddedEnd = addDaysToYmd(startDate, -1)
  const preWindowDays = buildOwnerDays({ ownerTimeZone, startDate: paddedStart, endDateInclusive: paddedEnd }).map(d => ({ ...d, inWindow: false }))

  return [...preWindowDays, ...windowDays]
}

export function chunkOwnerDaysByWeekStart(args: {
  ownerDays: OwnerDay[]
  weekStartDay: number
}): OwnerDay[][] {
  const { ownerDays, weekStartDay } = args
  const weeks: OwnerDay[][] = []
  let current: OwnerDay[] = []

  for (const day of ownerDays) {
    if (current.length > 0 && day.dayOfWeek === weekStartDay) {
      weeks.push(current)
      current = []
    }
    current.push(day)
  }
  if (current.length > 0) weeks.push(current)
  return weeks
}

export function parseBusyIntervals(busy: BusyIntervalDto[]): ParsedBusyInterval[] {
  const parsed: ParsedBusyInterval[] = []

  for (const b of busy) {
    const startUtcMs = parseIsoUtcToMs(b.startUtc)
    const endUtcMs = parseIsoUtcToMs(b.endUtc)
    if (startUtcMs === null || endUtcMs === null) continue
    if (endUtcMs <= startUtcMs) continue

    parsed.push({
      startUtcMs,
      endUtcMs,
      kind: b.kind,
      _rawStartUtc: b.startUtc,
      _rawEndUtc: b.endUtc
    })
  }

  return parsed
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

    if (typeof rateLimit === 'object' && rateLimit !== null && 'nextAllowedAtUtc' in rateLimit && 'scopes' in rateLimit) {
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

