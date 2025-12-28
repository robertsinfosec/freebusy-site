import { ArrowClockwise, Calendar, CalendarPlus, ClockAfternoon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/ThemeToggle'
import { labelForUsTimeZone, US_TIME_ZONES } from '@/lib/us-timezones'

interface AppHeaderProps {
  loading: boolean
  onRefresh: () => void
  refreshDisabledUntil?: string | null
  timeZone: string | null
  onTimeZoneChange?: (timeZone: string) => void
  calendarTimeZone: string | null
}

export function AppHeader({
  loading,
  onRefresh,
  refreshDisabledUntil = null,
  timeZone,
  onTimeZoneChange,
  calendarTimeZone
}: AppHeaderProps) {
  const now = Date.now()
  const disabledUntilMs = refreshDisabledUntil ? new Date(refreshDisabledUntil).getTime() : null
  const rateLimited = disabledUntilMs !== null && Number.isFinite(disabledUntilMs) && disabledUntilMs > now
  const refreshDisabled = loading || rateLimited

  const viewingTimeZone = timeZone ?? calendarTimeZone

  const refreshTitle = rateLimited && disabledUntilMs
    ? `Rate limited until ${new Date(disabledUntilMs).toLocaleTimeString('en-US', { timeZone: viewingTimeZone ?? 'Etc/UTC' })}`
    : 'Refresh'

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
          <Select
            value={viewingTimeZone ?? undefined}
            onValueChange={(value) => onTimeZoneChange?.(value)}
            disabled={!viewingTimeZone}
          >
            <SelectTrigger className="w-[170px]" aria-label="Viewing timezone">
              <SelectValue placeholder="Timezone" />
            </SelectTrigger>
            <SelectContent>
              {US_TIME_ZONES.map(tz => (
                <SelectItem key={tz.id} value={tz.id}>
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>{tz.label}</span>
                    {calendarTimeZone && tz.id === calendarTimeZone ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : null}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="default" size="sm" className="gap-2">
            <a href="https://cal.com/robertsinfosec" target="_blank" rel="noopener noreferrer">
              <CalendarPlus size={16} />
              Book a Meeting
            </a>
          </Button>
          <Button
            onClick={onRefresh}
            disabled={refreshDisabled}
            variant="outline"
            size="sm"
            className="gap-2"
            title={refreshTitle}
          >
            <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-base">
        Real-time availability from my scheduling calendar. Times are shown in {viewLabel}.
        Unshaded areas are working hours. Shaded areas are not available.
      </p>
    </div>
  )
}
