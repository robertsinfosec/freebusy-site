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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

  const getBusyBlocksForCell = (date: Date, hour: number) => {
    const cellStart = new Date(date)
    cellStart.setHours(hour, 0, 0, 0)
    const cellEnd = new Date(date)
    cellEnd.setHours(hour + 1, 0, 0, 0)

    return busyBlocks.filter(block => {
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
      <TooltipProvider>
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
                    {blocks.map((block, blockIdx) => (
                      <Tooltip key={blockIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute left-0 right-0 bg-primary/80 border-l-2 border-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors',
                              isPast && 'opacity-50'
                            )}
                            style={{
                              top: `${block.topPercent}%`,
                              height: `${block.heightPercent}%`
                            }}
                          >
                            <span className="text-xs font-semibold text-primary-foreground uppercase tracking-wide">
                              Busy
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{formatTimeRange(block.start, block.end)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}
