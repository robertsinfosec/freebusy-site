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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
  const hours = Array.from({ length: 10 }, (_, i) => i + 8)
  const dates = useMemo(() => 
    Array.from({ length: days }, (_, i) => addDays(startDate, i)),
    [startDate, days]
  )

  const getAllDayBlocksForDate = (date: Date) => {
    return busyBlocks.filter(block => block.isAllDay && isSameDay(block.start, date))
  }

  const getBusyBlocksForCell = (date: Date, hour: number) => {
    const cellStart = new Date(date)
    cellStart.setHours(hour, 0, 0, 0)
    const cellEnd = new Date(date)
    cellEnd.setHours(hour + 1, 0, 0, 0)

    return busyBlocks.filter(block => {
      if (block.isAllDay) return false
      return block.start < cellEnd && block.end > cellStart
    }).map(block => {
      const blockStart = new Date(Math.max(block.start.getTime(), cellStart.getTime()))
      const blockEnd = new Date(Math.min(block.end.getTime(), cellEnd.getTime()))
      
      const cellDuration = cellEnd.getTime() - cellStart.getTime()
      const blockStartOffset = blockStart.getTime() - cellStart.getTime()
      const blockDuration = blockEnd.getTime() - blockStart.getTime()
      
      const topPercent = (blockStartOffset / cellDuration) * 100
      const heightPercent = (blockDuration / cellDuration) * 100
      
      return {
        ...block,
        // use the clipped range for rendering and tooltips
        visibleStart: blockStart,
        visibleEnd: blockEnd,
        topPercent,
        heightPercent
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
                const blocks = getBusyBlocksForCell(date, hour)
                const allDayBlocks = getAllDayBlocksForDate(date)
                const isWorking = isWorkingHour(hour, date)
                const isWeekendDay = isWeekend(date)
                const isPast = date < today || (isSameDay(date, today) && hour < new Date().getHours())
                
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
                    {hour === hours[0] && allDayBlocks.length > 0 && (
                      <div className="absolute top-1 left-1 right-1 z-20 flex flex-col gap-1">
                        {allDayBlocks.map((block, idx) => (
                          <Tooltip key={`allday-${block.start.toISOString()}-${idx}`}>
                            <TooltipTrigger asChild>
                              <div className="rounded-md bg-destructive/85 text-destructive-foreground px-2 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm">
                                {block.summary || 'All day busy'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">All day</p>
                              {block.summary && <p className="text-sm text-muted-foreground">{block.summary}</p>}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                    {blocks.map((block, blockIdx) => (
                      <Tooltip key={`${block.start.toISOString()}-${blockIdx}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute left-0 right-0 bg-destructive/85 border-l-2 border-destructive text-destructive-foreground flex items-center justify-center cursor-pointer hover:bg-destructive/95 transition-colors',
                              isPast && 'opacity-50'
                            )}
                            style={{
                              top: `${block.topPercent}%`,
                              height: `${block.heightPercent}%`
                            }}
                          >
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Busy
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{formatTimeRange(block.visibleStart, block.visibleEnd)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
    </div>
  )
}
