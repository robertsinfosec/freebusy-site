import { useEffect, useMemo, useRef, useState } from 'react'

import { AppHeader } from '@/components/AppHeader'
import { AvailabilityCard } from '@/components/AvailabilityCard'
import { AvailabilityLoadingCard } from '@/components/AvailabilityLoadingCard'
import { useFreeBusy } from '@/hooks/use-freebusy'
import { addDaysInTimeZone, getStartOfDayInTimeZone, getStartOfWeekInTimeZone } from '@/lib/date-utils'
import { isSupportedUsTimeZone } from '@/lib/us-timezones'
import { BUILD_VERSION } from '@/version.generated'

const VIEW_TIMEZONE_STORAGE_KEY = 'freebusy.viewTimeZone'

function App() {
  const { busyBlocks, loading, disabledMessage, unavailableMessage, refresh, window, windowWeeks, refreshDisabledUntil, timezone, apiVersion, workingSchedule } = useFreeBusy()

  const calendarTimeZone = timezone && isSupportedUsTimeZone(timezone) ? timezone : null

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

  const effectiveViewTimeZone = viewTimeZone ?? calendarTimeZone
  const renderTimeZone = effectiveViewTimeZone ?? 'Etc/UTC'

  const today = useMemo(() => getStartOfDayInTimeZone(new Date(), renderTimeZone), [renderTimeZone])

  const windowStart = useMemo(() => (window?.start ? new Date(window.start) : null), [window?.start])
  const windowEnd = useMemo(() => (window?.end ? new Date(window.end) : null), [window?.end])

  const firstWeekStart = useMemo(() => {
    const anchor = windowStart ?? today
    return getStartOfWeekInTimeZone(anchor, renderTimeZone)
  }, [renderTimeZone, today, windowStart])

  const weekStarts = useMemo(() => {
    if (windowStart && windowEnd) {
      const start = getStartOfWeekInTimeZone(windowStart, renderTimeZone)
      const end = getStartOfWeekInTimeZone(windowEnd, renderTimeZone)
      const totalWeeks = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)
      return Array.from({ length: totalWeeks }, (_, i) => addDaysInTimeZone(start, i * 7, renderTimeZone))
    }

    const fallbackWeeks = Math.max(1, windowWeeks ?? 2)
    return Array.from({ length: fallbackWeeks }, (_, i) => addDaysInTimeZone(firstWeekStart, i * 7, renderTimeZone))
  }, [firstWeekStart, renderTimeZone, windowEnd, windowStart, windowWeeks])

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
            busyBlocks={busyBlocks}
            disabledMessage={disabledMessage}
            unavailableMessage={unavailableMessage}
            weekStarts={weekStarts}
            windowStart={windowStart}
            windowEnd={windowEnd}
            timeZone={renderTimeZone}
            calendarTimeZone={calendarTimeZone}
            workingSchedule={workingSchedule}
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