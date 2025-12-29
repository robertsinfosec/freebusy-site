import { useMemo } from 'react'
import type { OwnerDay, ParsedBusyInterval, WorkingHoursDayRuleDto } from '@/hooks/freebusy-utils'
import {
  formatTime,
  getTimeZoneParts,
  formatTimeRangeInTimeZone,
  makeDateInTimeZone,
  formatDateHeaderInTimeZone
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { getOwnerDayBusyIntervalRenderInfos, getHourSlots } from '@/components/calendar-grid-utils'
// tooltip removed in favor of native title

interface CalendarGridProps {
  ownerDays: OwnerDay[]
  busy: ParsedBusyInterval[]
  opacity?: number
  showTimeLabels?: boolean
  viewTimeZone: string
  ownerTimeZone: string
  weekStartDay?: number | null
  workingHoursWeekly?: WorkingHoursDayRuleDto[] | null
}

export function CalendarGrid({ 
  ownerDays,
  busy,
  opacity = 1,
  showTimeLabels = true,
  viewTimeZone,
  ownerTimeZone,
  weekStartDay: _weekStartDay = null,
  workingHoursWeekly = null
}: CalendarGridProps) {
  const todayOwnerDate = useMemo(() => {
    const p = getTimeZoneParts(new Date(), ownerTimeZone)
    const mm = String(p.month).padStart(2, '0')
    const dd = String(p.day).padStart(2, '0')
    return `${p.year}-${mm}-${dd}`
  }, [ownerTimeZone])

  const now = useMemo(() => new Date(), [])

  // Default grid hours in the *viewer* timezone.
  // If the calendar owner's working schedule extends outside this range, we expand
  // the grid so the entire schedulable window is visible.
  const DEFAULT_VIEW_START = 8
  const DEFAULT_VIEW_END = 18
  const CELL_HEIGHT = 48

  const scheduleByIsoWeekday = useMemo(() => {
    const map = new Map<number, { startMin: number; endMin: number }>()
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
  }, [workingHoursWeekly])

  const hasWorkingHours = scheduleByIsoWeekday.size > 0

  const ownerDateStarts = useMemo(() => {
    // Used only for display formatting (weekday/month/day) in the owner timezone.
    return ownerDays.map(d => new Date(d.startUtcMs))
  }, [ownerDays])

  const viewWorkIntervalsByDayIdx = useMemo(() => {
    // Working hours mapped into the *viewer* timezone, represented as minutes-of-day.
    // Note: if a rule maps across midnight in the viewer TZ, we extend endMin past 1440.
    return ownerDays.map((day) => {
      if (!hasWorkingHours) {
        return { startMin: DEFAULT_VIEW_START * 60, endMin: DEFAULT_VIEW_END * 60 }
      }

      const rule = scheduleByIsoWeekday.get(day.dayOfWeek)
      if (!rule) return null

      const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(day.ownerDate)
      if (!ymd) return null
      const year = Number(ymd[1])
      const month = Number(ymd[2])
      const dom = Number(ymd[3])

      const startHour = Math.floor(rule.startMin / 60)
      const startMinute = rule.startMin % 60
      const endHour = Math.floor(rule.endMin / 60)
      const endMinute = rule.endMin % 60

      const ownerStartInstant = makeDateInTimeZone({ year, month, day: dom, hour: startHour, minute: startMinute, second: 0 }, ownerTimeZone)
      const ownerEndInstant = makeDateInTimeZone({ year, month, day: dom, hour: endHour, minute: endMinute, second: 0 }, ownerTimeZone)

      const viewStart = getTimeZoneParts(ownerStartInstant, viewTimeZone)
      const viewEnd = getTimeZoneParts(ownerEndInstant, viewTimeZone)

      const viewStartMin = viewStart.hour * 60 + viewStart.minute
      let viewEndMin = viewEnd.hour * 60 + viewEnd.minute
      if (viewEndMin <= viewStartMin) viewEndMin += 24 * 60

      return { startMin: viewStartMin, endMin: viewEndMin }
    })
  }, [DEFAULT_VIEW_END, DEFAULT_VIEW_START, hasWorkingHours, ownerDays, ownerTimeZone, scheduleByIsoWeekday, viewTimeZone])

  const { workStartHour, workEndHour } = useMemo(() => {
    let minMinute = DEFAULT_VIEW_START * 60
    let maxMinute = DEFAULT_VIEW_END * 60

    if (hasWorkingHours) {
      for (const day of ownerDays) {
        const rule = scheduleByIsoWeekday.get(day.dayOfWeek)
        if (!rule) continue

        const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(day.ownerDate)
        if (!ymd) continue
        const year = Number(ymd[1])
        const month = Number(ymd[2])
        const dom = Number(ymd[3])

        const startHour = Math.floor(rule.startMin / 60)
        const startMinute = rule.startMin % 60
        const endHour = Math.floor(rule.endMin / 60)
        const endMinute = rule.endMin % 60

        const ownerStartInstant = makeDateInTimeZone({ year, month, day: dom, hour: startHour, minute: startMinute, second: 0 }, ownerTimeZone)
        const ownerEndInstant = makeDateInTimeZone({ year, month, day: dom, hour: endHour, minute: endMinute, second: 0 }, ownerTimeZone)

        const viewStart = getTimeZoneParts(ownerStartInstant, viewTimeZone)
        const viewEnd = getTimeZoneParts(ownerEndInstant, viewTimeZone)

        const viewStartMin = viewStart.hour * 60 + viewStart.minute
        let viewEndMin = viewEnd.hour * 60 + viewEnd.minute
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
  }, [hasWorkingHours, ownerDays, ownerTimeZone, scheduleByIsoWeekday, viewTimeZone])

  const hours = useMemo(() => getHourSlots(workStartHour, workEndHour), [workEndHour, workStartHour])

  return (
    <div 
      className="relative"
      style={{ opacity }}
    >
        <div
          className="grid gap-0 border border-border rounded-lg overflow-hidden"
          style={{ gridTemplateColumns: `auto repeat(${Math.max(1, ownerDays.length)}, minmax(0, 1fr))` }}
        >
          <div className="bg-card border-b border-r border-border" />
          
          {ownerDays.map((day, idx) => {
            const dayHasAvailability = !hasWorkingHours || scheduleByIsoWeekday.has(day.dayOfWeek)
            const isToday = day.ownerDate === todayOwnerDate
            const fullLabel = formatDateHeaderInTimeZone(ownerDateStarts[idx], ownerTimeZone)
            
            return (
              <div
                key={idx}
                className={cn(
                  'border-b border-border p-2 text-center text-[0.7rem] tracking-wide leading-tight min-w-0',
                  !dayHasAvailability && 'fb-day-header-unavailable',
                  isToday && 'bg-primary/15 ring-1 ring-primary/40 current-day-pulse border-l-[3px] border-l-foreground/40 dark:border-l-foreground/60'
                )}
              >
                <div
                  className={cn('truncate', !dayHasAvailability && 'text-muted-foreground')}
                  title={fullLabel}
                >
                  {fullLabel}
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
              
              {ownerDays.map((day, dayIdx) => {
                const isTodayColumn = day.ownerDate === todayOwnerDate

                const availability = (() => {
                  const interval = viewWorkIntervalsByDayIdx[dayIdx]
                  if (!interval) return { kind: 'none' as const }

                  const cellStartMin = hour * 60
                  const cellEndMin = cellStartMin + 60
                  const overlapStart = Math.max(cellStartMin, interval.startMin)
                  const overlapEnd = Math.min(cellEndMin, interval.endMin)

                  if (overlapEnd <= overlapStart) return { kind: 'none' as const }
                  if (overlapStart <= cellStartMin && overlapEnd >= cellEndMin) return { kind: 'full' as const }

                  const topPct = ((overlapStart - cellStartMin) / 60) * 100
                  const heightPct = ((overlapEnd - overlapStart) / 60) * 100
                  return { kind: 'partial' as const, topPct, heightPct }
                })()

                const isFirstHour = hour === workStartHour
                const dayBlocks = isFirstHour
                  ? getOwnerDayBusyIntervalRenderInfos({
                      ownerDay: day,
                      busy,
                      viewTimeZone,
                      workStart: workStartHour,
                      workEnd: workEndHour,
                      cellHeight: CELL_HEIGHT
                    })
                  : []
                
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className={cn(
                      'relative min-h-[48px] border-r border-b border-border',
                      availability.kind === 'full' ? 'fb-cell-available' : 'fb-cell-unavailable',
                      isTodayColumn && 'border-l-[3px] border-l-foreground/40 dark:border-l-foreground/60'
                    )}
                  >
                    {availability.kind === 'partial' ? (
                      <div
                        className="absolute left-0 right-0 fb-cell-available pointer-events-none"
                        style={{ top: `${availability.topPct}%`, height: `${availability.heightPct}%` }}
                      />
                    ) : null}
                    {isFirstHour && (
                      <div className="absolute left-0 right-0" style={{ top: 0, height: `${(workEndHour - workStartHour) * CELL_HEIGHT}px` }}>
                        {dayBlocks.map((block, blockIdx) => (
                          <div
                            key={`${block.startUtcMs}-${block.endUtcMs}-${blockIdx}`}
                            className={cn(
                              'fb-busy-block',
                              block.visibleEndUtcMs <= now.getTime() && 'opacity-50'
                            )}
                            style={{
                              top: `${block.topPx}px`,
                              height: `${block.heightPx}px`,
                              zIndex: 10
                            }}
                            title={formatTimeRangeInTimeZone(new Date(block.visibleStartUtcMs), new Date(block.visibleEndUtcMs), viewTimeZone)}
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
