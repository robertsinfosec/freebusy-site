import { useMemo } from 'react'
import type { OwnerDay, ParsedBusyInterval, WorkingHoursDayRuleDto } from '@/hooks/freebusy-utils'
import {
  formatTime,
  getTimeZoneParts,
  formatTimeRangeInTimeZone,
  formatDateHeaderInTimeZone
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
  buildScheduleByIsoWeekday,
  buildViewWorkIntervalsByOwnerDayIndex,
  getHourCellAvailability,
  getOwnerDayBusyIntervalRenderInfos,
  getHourSlots,
  getWorkHourBoundsInViewTimeZone
} from '@/components/calendar-grid-utils'
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

  const scheduleByIsoWeekday = useMemo(() => buildScheduleByIsoWeekday(workingHoursWeekly), [workingHoursWeekly])

  const hasWorkingHours = scheduleByIsoWeekday.size > 0

  const ownerDateStarts = useMemo(() => {
    // Used only for display formatting (weekday/month/day) in the owner timezone.
    return ownerDays.map(d => new Date(d.startUtcMs))
  }, [ownerDays])

  const viewWorkIntervalsByDayIdx = useMemo(() => {
    return buildViewWorkIntervalsByOwnerDayIndex({
      ownerDays,
      scheduleByIsoWeekday,
      ownerTimeZone,
      viewTimeZone,
      defaultViewStartHour: DEFAULT_VIEW_START,
      defaultViewEndHour: DEFAULT_VIEW_END
    })
  }, [DEFAULT_VIEW_END, DEFAULT_VIEW_START, ownerDays, ownerTimeZone, scheduleByIsoWeekday, viewTimeZone])

  const { workStartHour, workEndHour } = useMemo(() => {
    return getWorkHourBoundsInViewTimeZone({
      ownerDays,
      scheduleByIsoWeekday,
      ownerTimeZone,
      viewTimeZone,
      defaultViewStartHour: DEFAULT_VIEW_START,
      defaultViewEndHour: DEFAULT_VIEW_END
    })
  }, [ownerDays, ownerTimeZone, scheduleByIsoWeekday, viewTimeZone])

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
            const inWindow = day.inWindow !== false
            const dayHasAvailability = inWindow && (!hasWorkingHours || scheduleByIsoWeekday.has(day.dayOfWeek))
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
                const inWindow = day.inWindow !== false

                const availability = getHourCellAvailability({
                  inWindow,
                  interval: viewWorkIntervalsByDayIdx[dayIdx],
                  hour
                })

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
