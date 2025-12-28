import type { BusyBlock } from '@/lib/ical-parser'
import { getTimeZoneParts, makeDateInTimeZone } from '@/lib/date-utils'

export interface VisibleBusyBlock extends BusyBlock {
  visibleStart: Date
  visibleEnd: Date
  topPx: number
  heightPx: number
}

export function getHourSlots(workStart: number, workEnd: number): number[] {
  return Array.from({ length: workEnd - workStart }, (_, i) => i + workStart)
}

export function getDayBusyBlockRenderInfos({
  date,
  busyBlocks,
  workStart,
  workEnd,
  cellHeight,
  timeZone,
  calendarTimeZone
}: {
  date: Date
  busyBlocks: BusyBlock[]
  workStart: number
  workEnd: number
  cellHeight: number
  timeZone: string
  calendarTimeZone?: string | null
}): VisibleBusyBlock[] {
  const effectiveCalendarTimeZone = calendarTimeZone ?? timeZone
  const p = getTimeZoneParts(date, timeZone)

  const dayStart = makeDateInTimeZone({ year: p.year, month: p.month, day: p.day, hour: workStart, minute: 0, second: 0 }, timeZone)
  const dayEnd = makeDateInTimeZone({ year: p.year, month: p.month, day: p.day, hour: workEnd, minute: 0, second: 0 }, timeZone)

  const toDateKey = (d: Date, tz: string): string => {
    const parts = getTimeZoneParts(d, tz)
    const mm = String(parts.month).padStart(2, '0')
    const dd = String(parts.day).padStart(2, '0')
    return `${parts.year}-${mm}-${dd}`
  }

  // For all-day events, treat the date as a *label* (YYYY-MM-DD), not a time-zone-shifted instant.
  // This keeps an all-day event on "Jan 1" showing on Jan 1 regardless of which US timezone the viewer selects.
  const cellDateKey = toDateKey(date, timeZone)

  return busyBlocks
    .filter((block) => {
      if (block.isAllDay) {
        const startKey = toDateKey(block.start, effectiveCalendarTimeZone)
        const endKey = toDateKey(new Date(block.end.getTime() - 1), effectiveCalendarTimeZone)
        return cellDateKey >= startKey && cellDateKey <= endKey
      }

      return block.start < dayEnd && block.end > dayStart
    })
    .map((block) => {
      const effectiveStart = block.isAllDay
        ? dayStart
        : new Date(Math.max(block.start.getTime(), dayStart.getTime()))

      const effectiveEnd = block.isAllDay
        ? dayEnd
        : new Date(Math.min(block.end.getTime(), dayEnd.getTime()))

      const blockDurationMs = effectiveEnd.getTime() - effectiveStart.getTime()
      const topPx = ((effectiveStart.getTime() - dayStart.getTime()) / (60 * 60 * 1000)) * cellHeight
      const heightPx = (blockDurationMs / (60 * 60 * 1000)) * cellHeight

      return {
        ...block,
        visibleStart: effectiveStart,
        visibleEnd: effectiveEnd,
        topPx,
        heightPx
      }
    })
}
