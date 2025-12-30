import type { OwnerDay, ParsedBusyInterval } from '@/hooks/freebusy-utils'
import { getTimeZoneParts, makeDateInTimeZone } from '@/lib/date-utils'
import type { WorkingHoursDayRuleDto } from '@/hooks/freebusy-utils'

export interface VisibleBusyInterval extends ParsedBusyInterval {
  visibleStartUtcMs: number
  visibleEndUtcMs: number
  topPx: number
  heightPx: number
}

export function getHourSlots(workStart: number, workEnd: number): number[] {
  return Array.from({ length: workEnd - workStart }, (_, i) => i + workStart)
}

export type WorkingHoursSchedule = Map<number, { startMin: number; endMin: number }>

export type ViewWorkInterval = { startMin: number; endMin: number }

export function buildScheduleByIsoWeekday(workingHoursWeekly?: WorkingHoursDayRuleDto[] | null): WorkingHoursSchedule {
  const map: WorkingHoursSchedule = new Map()
  if (!workingHoursWeekly) return map

  for (const rule of workingHoursWeekly) {
    const [sh, sm] = rule.start.split(':').map(Number)
    const [eh, em] = rule.end.split(':').map(Number)
    if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) continue
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    map.set(rule.dayOfWeek, { startMin, endMin })
  }

  return map
}

function parseOwnerYmd(ownerDate: string): { year: number; month: number; day: number } | null {
  const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(ownerDate)
  if (!ymd) return null
  const year = Number(ymd[1])
  const month = Number(ymd[2])
  const day = Number(ymd[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return { year, month, day }
}

function mapOwnerRuleToViewInterval(args: {
  ownerDate: string
  ownerTimeZone: string
  viewTimeZone: string
  rule: { startMin: number; endMin: number }
}): ViewWorkInterval | null {
  const { ownerDate, ownerTimeZone, viewTimeZone, rule } = args
  const ymd = parseOwnerYmd(ownerDate)
  if (!ymd) return null

  const startHour = Math.floor(rule.startMin / 60)
  const startMinute = rule.startMin % 60
  const endHour = Math.floor(rule.endMin / 60)
  const endMinute = rule.endMin % 60

  const ownerStartInstant = makeDateInTimeZone(
    { year: ymd.year, month: ymd.month, day: ymd.day, hour: startHour, minute: startMinute, second: 0 },
    ownerTimeZone
  )
  const ownerEndInstant = makeDateInTimeZone(
    { year: ymd.year, month: ymd.month, day: ymd.day, hour: endHour, minute: endMinute, second: 0 },
    ownerTimeZone
  )

  const viewStart = getTimeZoneParts(ownerStartInstant, viewTimeZone)
  const viewEnd = getTimeZoneParts(ownerEndInstant, viewTimeZone)

  const viewStartMin = viewStart.hour * 60 + viewStart.minute
  let viewEndMin = viewEnd.hour * 60 + viewEnd.minute
  if (viewEndMin <= viewStartMin) viewEndMin += 24 * 60

  return { startMin: viewStartMin, endMin: viewEndMin }
}

export function buildViewWorkIntervalsByOwnerDayIndex(args: {
  ownerDays: OwnerDay[]
  scheduleByIsoWeekday: WorkingHoursSchedule
  ownerTimeZone: string
  viewTimeZone: string
  defaultViewStartHour: number
  defaultViewEndHour: number
}): Array<ViewWorkInterval | null> {
  const {
    ownerDays,
    scheduleByIsoWeekday,
    ownerTimeZone,
    viewTimeZone,
    defaultViewStartHour,
    defaultViewEndHour
  } = args

  const hasWorkingHours = scheduleByIsoWeekday.size > 0

  return ownerDays.map((day) => {
    if (!hasWorkingHours) {
      return { startMin: defaultViewStartHour * 60, endMin: defaultViewEndHour * 60 }
    }

    const rule = scheduleByIsoWeekday.get(day.dayOfWeek)
    if (!rule) return null

    return mapOwnerRuleToViewInterval({ ownerDate: day.ownerDate, ownerTimeZone, viewTimeZone, rule })
  })
}

export function getWorkHourBoundsInViewTimeZone(args: {
  ownerDays: OwnerDay[]
  scheduleByIsoWeekday: WorkingHoursSchedule
  ownerTimeZone: string
  viewTimeZone: string
  defaultViewStartHour: number
  defaultViewEndHour: number
}): { workStartHour: number; workEndHour: number } {
  const {
    ownerDays,
    scheduleByIsoWeekday,
    ownerTimeZone,
    viewTimeZone,
    defaultViewStartHour,
    defaultViewEndHour
  } = args

  let minMinute = defaultViewStartHour * 60
  let maxMinute = defaultViewEndHour * 60

  if (scheduleByIsoWeekday.size > 0) {
    for (const day of ownerDays) {
      const rule = scheduleByIsoWeekday.get(day.dayOfWeek)
      if (!rule) continue

      const interval = mapOwnerRuleToViewInterval({ ownerDate: day.ownerDate, ownerTimeZone, viewTimeZone, rule })
      if (!interval) continue

      minMinute = Math.min(minMinute, interval.startMin)
      maxMinute = Math.max(maxMinute, interval.endMin)
    }
  }

  const start = Math.max(0, Math.floor(minMinute / 60))
  const end = Math.min(24, Math.ceil(maxMinute / 60))

  if (end <= start) {
    return { workStartHour: defaultViewStartHour, workEndHour: defaultViewEndHour }
  }

  return { workStartHour: start, workEndHour: end }
}

export type HourCellAvailability =
  | { kind: 'none' }
  | { kind: 'full' }
  | { kind: 'partial'; topPct: number; heightPct: number }

export function getHourCellAvailability(args: {
  inWindow: boolean
  interval: ViewWorkInterval | null
  hour: number
}): HourCellAvailability {
  const { inWindow, interval, hour } = args
  if (!inWindow) return { kind: 'none' }
  if (!interval) return { kind: 'none' }

  const cellStartMin = hour * 60
  const cellEndMin = cellStartMin + 60
  const overlapStart = Math.max(cellStartMin, interval.startMin)
  const overlapEnd = Math.min(cellEndMin, interval.endMin)

  if (overlapEnd <= overlapStart) return { kind: 'none' }
  if (overlapStart <= cellStartMin && overlapEnd >= cellEndMin) return { kind: 'full' }

  const topPct = ((overlapStart - cellStartMin) / 60) * 100
  const heightPct = ((overlapEnd - overlapStart) / 60) * 100
  return { kind: 'partial', topPct, heightPct }
}

export function getOwnerDayBusyIntervalRenderInfos({
  ownerDay,
  busy,
  viewTimeZone,
  workStart,
  workEnd,
  cellHeight
}: {
  ownerDay: OwnerDay
  busy: ParsedBusyInterval[]
  viewTimeZone: string
  workStart: number
  workEnd: number
  cellHeight: number
}): VisibleBusyInterval[] {
  const viewStartMin = workStart * 60
  const viewEndMin = workEnd * 60

  const toViewerMinuteOfDay = (utcMs: number): number => {
    const p = getTimeZoneParts(new Date(utcMs), viewTimeZone)
    return p.hour * 60 + p.minute + p.second / 60
  }

  const intersectsOwnerDay = (startUtcMs: number, endUtcMs: number): boolean => {
    // Half-open intervals: [start, end)
    return startUtcMs < ownerDay.endUtcMs && endUtcMs > ownerDay.startUtcMs
  }

  return busy
    .filter((b) => intersectsOwnerDay(b.startUtcMs, b.endUtcMs))
    .map((b) => {
      if (b.kind === 'allDay') {
        return {
          ...b,
          visibleStartUtcMs: ownerDay.startUtcMs,
          visibleEndUtcMs: ownerDay.endUtcMs,
          topPx: 0,
          heightPx: ((viewEndMin - viewStartMin) / 60) * cellHeight
        }
      }

      const clippedStartUtcMs = Math.max(b.startUtcMs, ownerDay.startUtcMs)
      const clippedEndUtcMs = Math.min(b.endUtcMs, ownerDay.endUtcMs)
      if (clippedEndUtcMs <= clippedStartUtcMs) return null

      const startMin = toViewerMinuteOfDay(clippedStartUtcMs)
      let endMin = toViewerMinuteOfDay(clippedEndUtcMs)

      // Handle rare overnight mapping in the viewer timezone.
      if (endMin <= startMin) endMin += 24 * 60

      const visibleStartMin = Math.max(startMin, viewStartMin)
      const visibleEndMin = Math.min(endMin, viewEndMin)
      if (visibleEndMin <= visibleStartMin) return null

      const topPx = ((visibleStartMin - viewStartMin) / 60) * cellHeight
      const heightPx = ((visibleEndMin - visibleStartMin) / 60) * cellHeight

      return {
        ...b,
        visibleStartUtcMs: clippedStartUtcMs,
        visibleEndUtcMs: clippedEndUtcMs,
        topPx,
        heightPx
      }
    })
    .filter((x): x is VisibleBusyInterval => x !== null)
}
