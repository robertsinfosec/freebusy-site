import { CalendarGrid } from './CalendarGrid'
import type { OwnerDay, ParsedBusyInterval, WorkingHoursDayRuleDto } from '@/hooks/freebusy-utils'
import { formatDateInTimeZone, getTimeZoneDisplayName } from '@/lib/date-utils'
import { Badge } from '@/components/ui/badge'

interface WeekSectionProps {
  ownerDays: OwnerDay[]
  busy: ParsedBusyInterval[]
  opacity?: number
  showTimeLabels?: boolean
  className?: string
  viewTimeZone: string
  ownerTimeZone: string
  weekStartDay?: number | null
  workingHoursWeekly?: WorkingHoursDayRuleDto[] | null
}

export function WeekSection({ 
  ownerDays,
  busy,
  opacity = 1,
  showTimeLabels = true,
  className = '',
  viewTimeZone,
  ownerTimeZone,
  weekStartDay = null,
  workingHoursWeekly = null
}: WeekSectionProps) {
  const weekStartInstant = ownerDays.length > 0 ? new Date(ownerDays[0].startUtcMs) : new Date()
  const weekEndInstant = ownerDays.length > 0 ? new Date(ownerDays[ownerDays.length - 1].startUtcMs) : new Date()
  const tzAbbrev = getTimeZoneDisplayName(weekStartInstant, viewTimeZone, 'short')
  const tzLong = getTimeZoneDisplayName(weekStartInstant, viewTimeZone, 'long')
  
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <span>
          {formatDateInTimeZone(weekStartInstant, ownerTimeZone)}
          {' - '}
          {formatDateInTimeZone(weekEndInstant, ownerTimeZone)}
        </span>
        <Badge variant="secondary" title={tzLong}>
          {tzAbbrev}
        </Badge>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[640px] sm:min-w-0">
          <CalendarGrid
            ownerDays={ownerDays}
            busy={busy}
            opacity={opacity}
            showTimeLabels={showTimeLabels}
            viewTimeZone={viewTimeZone}
            ownerTimeZone={ownerTimeZone}
            weekStartDay={weekStartDay}
            workingHoursWeekly={workingHoursWeekly}
          />
        </div>
      </div>
    </div>
  )
}
