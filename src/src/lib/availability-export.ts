import type { OwnerDay, ParsedBusyInterval, WorkingHoursDayRuleDto, WindowDto } from '@/hooks/freebusy-utils'
import { formatDateHeaderInTimeZone, formatDateInTimeZone, formatTimeRangeInTimeZone, getTimeZoneDisplayName, getTimeZoneParts, makeDateInTimeZone } from '@/lib/date-utils'

function parseYmd(date: string): { year: number; month: number; day: number } | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return { year, month, day }
}

function addDaysToYmdParts(ymd: { year: number; month: number; day: number }, days: number): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days, 12, 0, 0, 0))
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() }
}

function floorToHalfHourInTimeZone(utcMs: number, timeZone: string): number {
  const p = getTimeZoneParts(new Date(utcMs), timeZone)
  const totalMin = p.hour * 60 + p.minute
  const rounded = Math.floor(totalMin / 30) * 30
  const dayOffset = Math.floor(rounded / 1440)
  const mins = ((rounded % 1440) + 1440) % 1440
  const hour = Math.floor(mins / 60)
  const minute = mins % 60

  const ymd = addDaysToYmdParts({ year: p.year, month: p.month, day: p.day }, dayOffset)
  return makeDateInTimeZone({ ...ymd, hour, minute, second: 0 }, timeZone).getTime()
}

function ceilToHalfHourInTimeZone(utcMs: number, timeZone: string): number {
  const p = getTimeZoneParts(new Date(utcMs), timeZone)
  // If there are seconds, bump by a minute so the ceil behaves as expected.
  const totalMin = p.hour * 60 + p.minute + (p.second > 0 ? 1 : 0)
  const rounded = Math.ceil(totalMin / 30) * 30
  const dayOffset = Math.floor(rounded / 1440)
  const mins = ((rounded % 1440) + 1440) % 1440
  const hour = Math.floor(mins / 60)
  const minute = mins % 60

  const ymd = addDaysToYmdParts({ year: p.year, month: p.month, day: p.day }, dayOffset)
  return makeDateInTimeZone({ ...ymd, hour, minute, second: 0 }, timeZone).getTime()
}

type Interval = { startUtcMs: number; endUtcMs: number }

function intersect(a: Interval, b: Interval): Interval | null {
  const startUtcMs = Math.max(a.startUtcMs, b.startUtcMs)
  const endUtcMs = Math.min(a.endUtcMs, b.endUtcMs)
  if (endUtcMs <= startUtcMs) return null
  return { startUtcMs, endUtcMs }
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((x, y) => x.startUtcMs - y.startUtcMs)
  const out: Interval[] = []

  for (const it of sorted) {
    const last = out[out.length - 1]
    if (!last || it.startUtcMs > last.endUtcMs) {
      out.push({ ...it })
      continue
    }

    last.endUtcMs = Math.max(last.endUtcMs, it.endUtcMs)
  }

  return out
}

function subtractInterval(base: Interval, blocks: Interval[]): Interval[] {
  const merged = mergeIntervals(blocks)
  const out: Interval[] = []

  let cursor = base.startUtcMs
  for (const b of merged) {
    if (b.endUtcMs <= cursor) continue
    if (b.startUtcMs > cursor) {
      out.push({ startUtcMs: cursor, endUtcMs: Math.min(b.startUtcMs, base.endUtcMs) })
    }
    cursor = Math.max(cursor, b.endUtcMs)
    if (cursor >= base.endUtcMs) break
  }

  if (cursor < base.endUtcMs) {
    out.push({ startUtcMs: cursor, endUtcMs: base.endUtcMs })
  }

  return out.filter(x => x.endUtcMs > x.startUtcMs)
}

function getWorkingIntervalUtc(args: {
  ownerDay: OwnerDay
  workingHoursWeekly: WorkingHoursDayRuleDto[] | null
  ownerTimeZone: string
  viewTimeZone: string
}): Interval | null {
  const { ownerDay, workingHoursWeekly, ownerTimeZone, viewTimeZone } = args

  if (workingHoursWeekly && workingHoursWeekly.length > 0) {
    const rule = workingHoursWeekly.find(r => r.dayOfWeek === ownerDay.dayOfWeek)
    if (!rule) return null

    const ymd = parseYmd(ownerDay.ownerDate)
    if (!ymd) return null

    const [sh, sm] = rule.start.split(':').map(Number)
    const [eh, em] = rule.end.split(':').map(Number)
    if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return null

    const start = makeDateInTimeZone({ ...ymd, hour: sh, minute: sm, second: 0 }, ownerTimeZone).getTime()
    const end = makeDateInTimeZone({ ...ymd, hour: eh, minute: em, second: 0 }, ownerTimeZone).getTime()
    if (end <= start) return null

    // Keep schedule bounded to the owner day window for safety.
    return intersect({ startUtcMs: start, endUtcMs: end }, { startUtcMs: ownerDay.startUtcMs, endUtcMs: ownerDay.endUtcMs })
  }

  // Fallback: default 8am-6pm using the *viewer* local date that corresponds to the owner day's start.
  // This path should be rare if the API provides working hours.
  const vp = getTimeZoneParts(new Date(ownerDay.startUtcMs), viewTimeZone)
  const start = makeDateInTimeZone({ year: vp.year, month: vp.month, day: vp.day, hour: 8, minute: 0, second: 0 }, viewTimeZone).getTime()
  const end = makeDateInTimeZone({ year: vp.year, month: vp.month, day: vp.day, hour: 18, minute: 0, second: 0 }, viewTimeZone).getTime()
  if (end <= start) return null

  return { startUtcMs: start, endUtcMs: end }
}

export function buildAvailabilityExportText(args: {
  ownerDays: OwnerDay[]
  busy: ParsedBusyInterval[]
  workingHoursWeekly: WorkingHoursDayRuleDto[] | null
  ownerTimeZone: string
  viewTimeZone: string
  window: WindowDto | null
  generatedAtUtcMs?: number | null
}): string {
  const { ownerDays, busy, workingHoursWeekly, ownerTimeZone, viewTimeZone, window, generatedAtUtcMs } = args

  const tzAbbrev = getTimeZoneDisplayName(new Date(), viewTimeZone, 'short')

  const dateRangeLabel = (() => {
    if (!window) return null
    const startYmd = parseYmd(window.startDate)
    const endYmd = parseYmd(window.endDateInclusive)
    if (!startYmd || !endYmd) return null

    const start = makeDateInTimeZone({ ...startYmd, hour: 0, minute: 0, second: 0 }, ownerTimeZone)
    const end = makeDateInTimeZone({ ...endYmd, hour: 0, minute: 0, second: 0 }, ownerTimeZone)

    return `${formatDateInTimeZone(start, ownerTimeZone)} to ${formatDateInTimeZone(end, ownerTimeZone)}`
  })()

  const lines: string[] = []
  lines.push(`Availability (${tzAbbrev})${dateRangeLabel ? ` — ${dateRangeLabel}` : ''}`)
  lines.push(`Times shown in ${tzAbbrev} (${viewTimeZone}).`)
  lines.push('')

  const generatedAt = generatedAtUtcMs ? new Date(generatedAtUtcMs) : null
  if (generatedAt) {
    lines.push(`Generated: ${generatedAt.toISOString()}`)
    lines.push('')
  }

  for (const day of ownerDays) {
    const working = getWorkingIntervalUtc({ ownerDay: day, workingHoursWeekly, ownerTimeZone, viewTimeZone })
    const dayLabel = formatDateHeaderInTimeZone(new Date(day.startUtcMs), ownerTimeZone)

    if (!working) {
      lines.push(`${dayLabel}: No availability`)
      continue
    }

    const roundedWorking: Interval = {
      startUtcMs: ceilToHalfHourInTimeZone(working.startUtcMs, viewTimeZone),
      endUtcMs: floorToHalfHourInTimeZone(working.endUtcMs, viewTimeZone)
    }

    if (roundedWorking.endUtcMs <= roundedWorking.startUtcMs) {
      lines.push(`${dayLabel}: No availability`)
      continue
    }

    const busyBlocks: Interval[] = []
    for (const b of busy) {
      // Busy is rendered per owner-day column, so clip to the owner day.
      const clipped = intersect(
        { startUtcMs: b.startUtcMs, endUtcMs: b.endUtcMs },
        { startUtcMs: day.startUtcMs, endUtcMs: day.endUtcMs }
      )
      if (!clipped) continue

      // All-day events block the whole day (within working hours).
      const rounded = b.kind === 'allDay'
        ? { ...roundedWorking }
        : {
            startUtcMs: floorToHalfHourInTimeZone(clipped.startUtcMs, viewTimeZone),
            endUtcMs: ceilToHalfHourInTimeZone(clipped.endUtcMs, viewTimeZone)
          }

      const withinWork = intersect(rounded, roundedWorking)
      if (withinWork) busyBlocks.push(withinWork)
    }

    const available = subtractInterval(roundedWorking, busyBlocks)

    if (available.length === 0) {
      lines.push(`${dayLabel}: No availability`)
      continue
    }

    const ranges = available
      .map(r => formatTimeRangeInTimeZone(new Date(r.startUtcMs), new Date(r.endUtcMs), viewTimeZone))
      .join('; ')

    lines.push(`${dayLabel}: ${ranges}`)
  }

  return lines.join('\n')
}
