import { useMemo } from 'react'
import { BusyBlock } from '@/lib/ical-parser'
import { 
  formatDateHeader, 
  formatTime, 
  isSameDay, 
  isWorkingHour,
  isWeekend,
  addDays,
  getStartOfDay
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

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
  const hours = Array.from({ length: 24 }, (_, i) => i)
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
              const isWorking = isWorkingHour(hour, date)
              const isWeekendDay = isWeekend(date)
              const isPast = date < today || (isSameDay(date, today) && hour < new Date().getHours())
              
              return (
                <div
                  key={`${dateIdx}-${hour}`}
                  className={cn(
                    'relative min-h-[32px] border-r border-b border-border',
                    !isWorking && 'bg-muted/10',
                    isWeekendDay && 'bg-muted/30',
                    isPast && 'opacity-40'
                  )}
                >
                  {blocks.length > 0 && (
                    <div
                      className={cn(
                        'absolute inset-0 bg-primary/80 border-l-2 border-primary',
                        isPast && 'opacity-50'
                      )}
                      title={blocks[0].summary || 'Busy'}
                    />
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
