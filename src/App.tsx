import { useEffect, useMemo, useRef, useState } from 'react'

import { AppHeader } from '@/components/AppHeader'
import { AvailabilityCard } from '@/components/AvailabilityCard'
import { AvailabilityLoadingCard } from '@/components/AvailabilityLoadingCard'
import { useFreeBusy } from '@/hooks/use-freebusy'
import { getStartOfDayInTimeZone } from '@/lib/date-utils'
import { isSupportedUsTimeZone } from '@/lib/us-timezones'
import { BUILD_VERSION } from '@/version.generated'

const VIEW_TIMEZONE_STORAGE_KEY = 'freebusy.viewTimeZone'

function App() {
  const { busy, loading, disabledMessage, unavailableMessage, refresh, refreshDisabledUntil, ownerTimeZone, apiVersion, ownerWeeks, weekStartDay, workingHours } = useFreeBusy()

  // Owner timezone is authoritative for the day columns.
  const ownerCalendarTimeZone = ownerTimeZone ?? null
  // Viewer timezone dropdown is US-only; default to owner TZ if it is in the list.
  const calendarTimeZone = ownerCalendarTimeZone && isSupportedUsTimeZone(ownerCalendarTimeZone)
    ? ownerCalendarTimeZone
    : null

  // Display timezone is user-controlled; default to the API timezone.
  const [viewTimeZone, setViewTimeZone] = useState<string | null>(() => {
    try {
      const stored = globalThis.localStorage?.getItem(VIEW_TIMEZONE_STORAGE_KEY)
      if (stored && isSupportedUsTimeZone(stored)) return stored
    } catch {
      // ignore
    }

    return null
  })
  const userHasChosenTimeZoneRef = useRef(false)

  useEffect(() => {
    try {
      const stored = globalThis.localStorage?.getItem(VIEW_TIMEZONE_STORAGE_KEY)
      if (stored && isSupportedUsTimeZone(stored)) {
        userHasChosenTimeZoneRef.current = true
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!userHasChosenTimeZoneRef.current && calendarTimeZone) {
      setViewTimeZone(calendarTimeZone)
    }
  }, [calendarTimeZone])

  const effectiveViewTimeZone = viewTimeZone ?? calendarTimeZone ?? 'America/New_York'
  const renderTimeZone = effectiveViewTimeZone

  const today = useMemo(
    () => getStartOfDayInTimeZone(new Date(), ownerCalendarTimeZone ?? renderTimeZone),
    [ownerCalendarTimeZone, renderTimeZone]
  )

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <AppHeader
          loading={loading}
          onRefresh={refresh}
          refreshDisabledUntil={refreshDisabledUntil}
          timeZone={effectiveViewTimeZone}
          calendarTimeZone={calendarTimeZone}
          onTimeZoneChange={(tz) => {
            userHasChosenTimeZoneRef.current = true
            setViewTimeZone(tz)
            try {
              globalThis.localStorage?.setItem(VIEW_TIMEZONE_STORAGE_KEY, tz)
            } catch {
              // ignore
            }
          }}
        />

        {loading ? (
          <AvailabilityLoadingCard />
        ) : (
          <AvailabilityCard
            today={today}
            busy={busy}
            disabledMessage={disabledMessage}
            unavailableMessage={unavailableMessage}
            ownerWeeks={ownerWeeks}
            viewTimeZone={renderTimeZone}
            ownerTimeZone={ownerCalendarTimeZone ?? 'Etc/UTC'}
            weekStartDay={weekStartDay}
            workingHoursWeekly={workingHours?.weekly ?? null}
          />
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Version {BUILD_VERSION}{apiVersion ? ` (API: ${apiVersion})` : ''}</p>
          <p>Calendar updates every 5 minutes · Last updated: {new Date().toLocaleTimeString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}

export default App