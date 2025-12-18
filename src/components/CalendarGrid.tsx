import { useMemo } from 'react'
import { BusyBlock } from '@/lib/ical-parser'
import {
  formatDateHeader,
  formatTime,
  isSameDay,
  isWorkingHour,
  isWeekend,
  addDays,
  getStartOfDay,
  formatTimeRange
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'
// tooltip removed in favor of native title

interface CalendarGridProps {
  startDate: Date
  days: number
  busyBlocks: BusyBlock[]
  opacity?: number
  showTimeLabels?: boolean
}

export function CalendarGrid({ 
  startDate, 
  days, 
  busyBlocks, 
  opacity = 1,
  showTimeLabels = true 
}: CalendarGridProps) {
  const today = useMemo(() => getStartOfDay(new Date()), [])
  const WORK_START = 8
  const WORK_END = 18
  const CELL_HEIGHT = 48
  const hours = Array.from({ length: WORK_END - WORK_START }, (_, i) => i + WORK_START)
  const dates = useMemo(() => 
    Array.from({ length: days }, (_, i) => addDays(startDate, i)),
    [startDate, days]
  )

  const getDayBlocks = (date: Date) => {
    const dayStart = new Date(date)
    dayStart.setHours(WORK_START, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(WORK_END, 0, 0, 0)

    return busyBlocks
      .filter(block => block.start < dayEnd && block.end > dayStart)
      .map(block => {
        const effectiveStart = block.isAllDay
          ? dayStart
          : new Date(Math.max(block.start.getTime(), dayStart.getTime()))
        const effectiveEnd = block.isAllDay
          ? dayEnd
          : new Date(Math.min(block.end.getTime(), dayEnd.getTime()))

        const blockDuration = effectiveEnd.getTime() - effectiveStart.getTime()
        const topPx = ((effectiveStart.getTime() - dayStart.getTime()) / (60 * 60 * 1000)) * CELL_HEIGHT
        const heightPx = (blockDuration / (60 * 60 * 1000)) * CELL_HEIGHT

        return {
          ...block,
          visibleStart: effectiveStart,
          visibleEnd: effectiveEnd,
          topPx,
          heightPx
        }
      })
  }

  return (
    <div 
      className="relative"
      style={{ opacity }}
    >
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border border-border rounded-lg overflow-hidden">
          <div className="bg-card border-b border-r border-border" />
          
          {dates.map((date, idx) => {
            const isToday = isSameDay(date, today)
            const isWeekendDay = isWeekend(date)
            
            return (
              <div
                key={idx}
                className={cn(
                  'border-b border-border p-2 text-center text-sm font-semibold tracking-wide',
                  isWeekendDay && 'bg-muted/30',
                  isToday && 'bg-accent/20 current-day-pulse'
                )}
              >
                <div className={cn(
                  isToday && 'text-accent',
                  isWeekendDay && !isToday && 'text-muted-foreground'
                )}>
                  {formatDateHeader(date)}
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
                const isWorking = isWorkingHour(hour, date)
                const isWeekendDay = isWeekend(date)
                const isPast = date < today || (isSameDay(date, today) && hour < new Date().getHours())
                const isFirstHour = hour === WORK_START
                const dayBlocks = isFirstHour ? getDayBlocks(date) : []
                
                return (
                  <div
                    key={`${dateIdx}-${hour}`}
                    className={cn(
                      'relative min-h-[48px] border-r border-b border-border',
                      !isWorking && 'bg-muted/10',
                      isWeekendDay && 'bg-muted/30',
                      isPast && 'opacity-40'
                    )}
                  >
                    {isFirstHour && (
                      <div className="absolute left-0 right-0" style={{ top: 0, height: `${(WORK_END - WORK_START) * CELL_HEIGHT}px` }}>
                        {dayBlocks.map((block, blockIdx) => (
                          <div
                            key={`${block.start.toISOString()}-${blockIdx}`}
                            className={cn(
                              'absolute left-0 right-0 bg-destructive/85 border-l-2 border-destructive text-destructive-foreground flex items-center justify-center cursor-pointer hover:bg-destructive/95 transition-colors rounded-md shadow-sm',
                              isPast && 'opacity-50'
                            )}
                            style={{
                              top: `${block.topPx}px`,
                              height: `${block.heightPx}px`,
                              zIndex: 10
                            }}
                            title={formatTimeRange(block.visibleStart, block.visibleEnd)}
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
