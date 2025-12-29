import type { OwnerDay, ParsedBusyInterval } from '@/hooks/freebusy-utils'
import { getTimeZoneParts } from '@/lib/date-utils'

export interface VisibleBusyInterval extends ParsedBusyInterval {
  visibleStartUtcMs: number
  visibleEndUtcMs: number
  topPx: number
  heightPx: number
}

export function getHourSlots(workStart: number, workEnd: number): number[] {
  return Array.from({ length: workEnd - workStart }, (_, i) => i + workStart)
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

      let startMin = toViewerMinuteOfDay(clippedStartUtcMs)
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
