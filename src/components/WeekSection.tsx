import { CalendarGrid } from './CalendarGrid'
import { BusyBlock } from '@/lib/ical-parser'
import { addDays } from '@/lib/date-utils'

interface WeekSectionProps {
  startDate: Date
  busyBlocks: BusyBlock[]
  opacity?: number
  showTimeLabels?: boolean
  className?: string
}

export function WeekSection({ 
  startDate, 
  busyBlocks, 
  opacity = 1,
  showTimeLabels = true,
  className = ''
}: WeekSectionProps) {
  const weekEnd = addDays(startDate, 6)
  
  return (
    <div className={className}>
      <div className="mb-2 text-sm text-muted-foreground font-medium">
        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' - '}
        {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <CalendarGrid
        startDate={startDate}
        days={7}
        busyBlocks={busyBlocks}
        opacity={opacity}
        showTimeLabels={showTimeLabels}
      />
    </div>
  )
}
