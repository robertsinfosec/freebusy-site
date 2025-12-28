import { useMemo } from 'react'
import type { BusyBlock } from '@/lib/ical-parser'
import type { WorkingScheduleDto } from '@/hooks/freebusy-utils'
import {
  formatDateHeaderInTimeZone,
  formatTime,
  addDaysInTimeZone,
  getStartOfDayInTimeZone,
  getTimeZoneParts,
  formatTimeRangeInTimeZone,
  getTimeZoneWeekday,
  makeDateInTimeZone
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { getDayBusyBlockRenderInfos, getHourSlots } from '@/components/calendar-grid-utils'
// tooltip removed in favor of native title

interface CalendarGridProps {
  startDate: Date
  days: number
  busyBlocks: BusyBlock[]
  opacity?: number
  showTimeLabels?: boolean
  windowStart?: Date | null
  windowEnd?: Date | null
  timeZone?: string
  calendarTimeZone?: string | null
  workingSchedule?: WorkingScheduleDto | null
}

export function CalendarGrid({ 
  startDate, 
  days, 
  busyBlocks, 
  opacity = 1,
  showTimeLabels = true,
  windowStart = null,
  windowEnd = null,
  timeZone = 'Etc/UTC',
  calendarTimeZone: _calendarTimeZone = null,
  workingSchedule = null
}: CalendarGridProps) {
  const today = useMemo(() => getStartOfDayInTimeZone(new Date(), timeZone), [timeZone])
  const now = useMemo(() => new Date(), [])

  // Default grid hours in the *viewer* timezone.
  // If the calendar owner's working schedule extends outside this range, we expand
  // the grid so the entire schedulable window is visible.
  const DEFAULT_VIEW_START = 8
  const DEFAULT_VIEW_END = 18
  const CELL_HEIGHT = 48

  const scheduleTimeZone = workingSchedule?.timeZone ?? _calendarTimeZone
  const scheduleByWeekday = useMemo(() => {
    const map = new Map<number, { startMin: number; endMin: number }>()
    if (!workingSchedule?.weekly) return map

    for (const rule of workingSchedule.weekly) {
      const [sh, sm] = rule.start.split(':').map(Number)
      const [eh, em] = rule.end.split(':').map(Number)
      if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) continue
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      map.set(rule.dayOfWeek, { startMin, endMin })
    }

    return map
  }, [workingSchedule?.weekly])

  const hasWorkingSchedule = Boolean(scheduleTimeZone && scheduleByWeekday.size > 0)

  const dates = useMemo(
    () => Array.from({ length: days }, (_, i) => addDaysInTimeZone(startDate, i, timeZone)),
    [startDate, days, timeZone]
  )
  const dateParts = useMemo(() => dates.map(d => getTimeZoneParts(d, timeZone)), [dates, timeZone])

  const { workStartHour, workEndHour } = useMemo(() => {
    let minMinute = DEFAULT_VIEW_START * 60
    let maxMinute = DEFAULT_VIEW_END * 60

    if (scheduleTimeZone && scheduleByWeekday.size > 0) {
      for (const dp of dateParts) {
        // Use local noon to pick the "owner date" that corresponds to this viewer day.
        const noonInstant = makeDateInTimeZone({
          year: dp.year,
          month: dp.month,
          day: dp.day,
          hour: 12,
          minute: 0,
          second: 0
        }, timeZone)

        const ownerWeekday = getTimeZoneWeekday(noonInstant, scheduleTimeZone)
        const rule = scheduleByWeekday.get(ownerWeekday)
        if (!rule) continue

        const ownerDate = getTimeZoneParts(noonInstant, scheduleTimeZone)
        const startHour = Math.floor(rule.startMin / 60)
        const startMinute = rule.startMin % 60
        const endHour = Math.floor(rule.endMin / 60)
        const endMinute = rule.endMin % 60

        const ownerStartInstant = makeDateInTimeZone({
          year: ownerDate.year,
          month: ownerDate.month,
          day: ownerDate.day,
          hour: startHour,
          minute: startMinute,
          second: 0
        }, scheduleTimeZone)

        const ownerEndInstant = makeDateInTimeZone({
          year: ownerDate.year,
          month: ownerDate.month,
          day: ownerDate.day,
          hour: endHour,
          minute: endMinute,
          second: 0
        }, scheduleTimeZone)

        const viewStart = getTimeZoneParts(ownerStartInstant, timeZone)
        const viewEnd = getTimeZoneParts(ownerEndInstant, timeZone)

        const viewStartMin = viewStart.hour * 60 + viewStart.minute
        let viewEndMin = viewEnd.hour * 60 + viewEnd.minute

        // Handle rare overnight mapping.
        if (viewEndMin <= viewStartMin) viewEndMin += 24 * 60

        minMinute = Math.min(minMinute, viewStartMin)
        maxMinute = Math.max(maxMinute, viewEndMin)
      }
    }

    const start = Math.max(0, Math.floor(minMinute / 60))
    const end = Math.min(24, Math.ceil(maxMinute / 60))

    if (end <= start) {
      return { workStartHour: DEFAULT_VIEW_START, workEndHour: DEFAULT_VIEW_END }
    }

    return { workStartHour: start, workEndHour: end }
  }, [dateParts, scheduleByWeekday, scheduleTimeZone, timeZone])

  const hours = useMemo(() => getHourSlots(workStartHour, workEndHour), [workEndHour, workStartHour])

  const windowStartDay = useMemo(
    () => (windowStart ? getStartOfDayInTimeZone(windowStart, timeZone) : null),
    [windowStart, timeZone]
  )
  const windowEndDay = useMemo(
    () => (windowEnd ? getStartOfDayInTimeZone(windowEnd, timeZone) : null),
    [windowEnd, timeZone]
  )

  const isDayInWindow = (date: Date): boolean => {
    if (!windowStartDay || !windowEndDay) return true
    return date.getTime() >= windowStartDay.getTime() && date.getTime() <= windowEndDay.getTime()
  }

  const isWindowFirstDay = (date: Date): boolean => {
    if (!windowStartDay) return false
    return date.getTime() === windowStartDay.getTime()
  }

  return (
    <div 
      className="relative"
      style={{ opacity }}
    >
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border border-border rounded-lg overflow-hidden">
          <div className="bg-card border-b border-r border-border" />
          
          {dates.map((date, idx) => {
            const isToday = date.getTime() === today.getTime()
            const inWindow = isDayInWindow(date)
            const dayHasAvailability = (() => {
              if (!hasWorkingSchedule) return true

              const dp = dateParts[idx]
              const noonInstant = makeDateInTimeZone({
                year: dp.year,
                month: dp.month,
                day: dp.day,
                hour: 12,
                minute: 0,
                second: 0
              }, timeZone)

              const ownerWeekday = getTimeZoneWeekday(noonInstant, scheduleTimeZone!)
              return scheduleByWeekday.has(ownerWeekday)
            })()
            
            return (
              <div
                key={idx}
                className={cn(
                  'border-b border-border p-2 text-center text-xs sm:text-sm tracking-wide whitespace-nowrap leading-tight',
                  (!dayHasAvailability || !inWindow) && 'fb-day-header-unavailable',
                  isToday && 'bg-primary/15 ring-1 ring-primary/40 current-day-pulse border-l-[3px] border-l-foreground/40 dark:border-l-foreground/60'
                )}
              >
                <div className={cn(
                  isToday ? 'text-primary font-semibold' : undefined,
                  !dayHasAvailability && !isToday && 'text-muted-foreground'
                )}>
                  {formatDateHeaderInTimeZone(date, timeZone)}
                </div>
              </div>
            )
          })}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              {showTimeLabels && (
                <div className="bg-card border-r border-border p-2 text-xs text-right text-muted-foreground font-medium">
                  {formatTime(hour)}
                </div>
              )}
              {!showTimeLabels && (
                <div className="bg-card border-r border-border" />
              )}
              
              {dates.map((date, dateIdx) => {
                const inWindow = isDayInWindow(date)
                const isTodayColumn = date.getTime() === today.getTime()

                const isAvailable = (() => {
                  if (!hasWorkingSchedule) {
                    return hour >= DEFAULT_VIEW_START && hour < DEFAULT_VIEW_END
                  }

                  const dp = dateParts[dateIdx]
                  const cellInstant = makeDateInTimeZone({
                    year: dp.year,
                    month: dp.month,
                    day: dp.day,
                    hour,
                    minute: 0,
                    second: 0
                  }, timeZone)

                  const ownerWeekday = getTimeZoneWeekday(cellInstant, scheduleTimeZone!)
                  const rule = scheduleByWeekday.get(ownerWeekday)
                  if (!rule) return false

                  const ownerParts = getTimeZoneParts(cellInstant, scheduleTimeZone!)
                  const mins = ownerParts.hour * 60 + ownerParts.minute
                  return mins >= rule.startMin && mins < rule.endMin
                })()

                const suppressPast = isWindowFirstDay(date)
                const isFirstHour = hour === workStartHour
                const dayBlocks = isFirstHour && inWindow
                  ? getDayBusyBlockRenderInfos({
                      date,
                      busyBlocks,
                      workStart: workStartHour,
                      workEnd: workEndHour,
                      cellHeight: CELL_HEIGHT,
                      timeZone,
                      calendarTimeZone: _calendarTimeZone
                    })
                  : []
                
                return (
                  <div
                    key={`${dateIdx}-${hour}`}
                    className={cn(
                      'relative min-h-[48px] border-r border-b border-border',
                      !inWindow
                        ? 'fb-cell-outside-window'
                        : (isAvailable ? 'fb-cell-available' : 'fb-cell-unavailable'),
                      isTodayColumn && 'border-l-[3px] border-l-foreground/40 dark:border-l-foreground/60'
                    )}
                  >
                    {isFirstHour && (
                      <div className="absolute left-0 right-0" style={{ top: 0, height: `${(workEndHour - workStartHour) * CELL_HEIGHT}px` }}>
                        {dayBlocks.map((block, blockIdx) => (
                          <div
                            key={`${block.start.toISOString()}-${blockIdx}`}
                            className={cn(
                              'fb-busy-block',
                              !suppressPast && block.visibleEnd <= now && 'opacity-50'
                            )}
                            style={{
                              top: `${block.topPx}px`,
                              height: `${block.heightPx}px`,
                              zIndex: 10
                            }}
                            title={formatTimeRangeInTimeZone(block.visibleStart, block.visibleEnd, timeZone)}
                          >
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Busy
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
    </div>
  )
}
