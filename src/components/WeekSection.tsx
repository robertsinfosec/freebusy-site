import { CalendarGrid } from './CalendarGrid'
import type { BusyBlock } from '@/lib/ical-parser'
import { addDaysInTimeZone, formatDateInTimeZone, getTimeZoneDisplayName } from '@/lib/date-utils'
import { Badge } from '@/components/ui/badge'
import type { WorkingScheduleDto } from '@/hooks/freebusy-utils'

interface WeekSectionProps {
  startDate: Date
  busyBlocks: BusyBlock[]
  opacity?: number
  showTimeLabels?: boolean
  className?: string
  windowStart?: Date | null
  windowEnd?: Date | null
  timeZone?: string
  calendarTimeZone?: string | null
  workingSchedule?: WorkingScheduleDto | null
}

export function WeekSection({ 
  startDate, 
  busyBlocks, 
  opacity = 1,
  showTimeLabels = true,
  className = '',
  windowStart = null,
  windowEnd = null,
  timeZone = 'Etc/UTC',
  calendarTimeZone = null,
  workingSchedule = null
}: WeekSectionProps) {
  const weekEnd = addDaysInTimeZone(startDate, 6, timeZone)
  const tzAbbrev = getTimeZoneDisplayName(startDate, timeZone, 'short')
  const tzLong = getTimeZoneDisplayName(startDate, timeZone, 'long')
  
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <span>
          {formatDateInTimeZone(startDate, timeZone)}
          {' - '}
          {formatDateInTimeZone(weekEnd, timeZone)}
        </span>
        <Badge variant="secondary" title={tzLong}>
          {tzAbbrev}
        </Badge>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[640px] sm:min-w-0">
          <CalendarGrid
            startDate={startDate}
            days={7}
            busyBlocks={busyBlocks}
            opacity={opacity}
            showTimeLabels={showTimeLabels}
            windowStart={windowStart}
            windowEnd={windowEnd}
            timeZone={timeZone}
            calendarTimeZone={calendarTimeZone}
            workingSchedule={workingSchedule}
          />
        </div>
      </div>
    </div>
  )
}
