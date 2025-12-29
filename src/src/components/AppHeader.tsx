import { Calendar, CalendarPlus } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/ThemeToggle'
import { labelForUsTimeZone, US_TIME_ZONES } from '@/lib/us-timezones'

interface AppHeaderProps {
  loading: boolean
  timeZone: string | null
  onTimeZoneChange?: (timeZone: string) => void
  calendarTimeZone: string | null
  showTimeZoneSelect?: boolean
  showAvailabilityDescription?: boolean
}

export function AppHeader({
  loading,
  timeZone,
  onTimeZoneChange,
  calendarTimeZone,
  showTimeZoneSelect = true,
  showAvailabilityDescription = true
}: AppHeaderProps) {
  const viewingTimeZone = timeZone ?? calendarTimeZone

  const viewLabel = viewingTimeZone ? labelForUsTimeZone(viewingTimeZone) : '—'
  const calendarLabel = calendarTimeZone ? labelForUsTimeZone(calendarTimeZone) : '—'


  return (
    <div className="mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <Calendar size={28} weight="duotone" className="text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            robertsinfosec Free/Busy
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ThemeToggle />
          {showTimeZoneSelect ? (
            <Select
              value={viewingTimeZone ?? undefined}
              onValueChange={(value) => onTimeZoneChange?.(value)}
              disabled={!viewingTimeZone}
            >
              <SelectTrigger className="w-[190px]" aria-label="Viewing timezone">
                <SelectValue placeholder="Timezone" />
              </SelectTrigger>
              <SelectContent>
                {US_TIME_ZONES.map(tz => (
                  <SelectItem key={tz.id} value={tz.id}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span>{tz.label}</span>
                      {calendarTimeZone && tz.id === calendarTimeZone ? (
                        <Badge variant="secondary">Owner TZ</Badge>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button asChild variant="default" size="sm" className="gap-2">
            <a href="https://cal.com/robertsinfosec" target="_blank" rel="noopener noreferrer">
              <CalendarPlus size={16} />
              Book a Meeting
            </a>
          </Button>
        </div>
      </div>
      <div className="text-muted-foreground text-base">
        <p>
          Real-time view of my scheduling availability.
        </p>
        {showAvailabilityDescription ? (
          <p>
            Times are shown in {viewLabel}. Unshaded areas are working hours. Shaded areas are not available.
          </p>
        ) : null}
      </div>
    </div>
  )
}
