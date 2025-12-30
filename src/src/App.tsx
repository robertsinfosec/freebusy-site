import { useEffect, useMemo, useRef, useState } from 'react'

import { AppHeader } from '@/components/AppHeader'
import { AvailabilityCard } from '@/components/AvailabilityCard'
import { AvailabilityLoadingCard } from '@/components/AvailabilityLoadingCard'
import { useFreeBusy } from '@/hooks/use-freebusy'
import { getStartOfDayInTimeZone } from '@/lib/date-utils'
import { buildAvailabilityExportText } from '@/lib/availability-export'
import { isSupportedUsTimeZone } from '@/lib/us-timezones'
import { BUILD_VERSION } from '@/version.generated'

const VIEW_TIMEZONE_STORAGE_KEY = 'freebusy.viewTimeZone'

function App() {
  const { busy, loading, disabledMessage, unavailableMessage, refresh, refreshDisabledUntil, ownerTimeZone, apiVersion, ownerWeeks, weekStartDay, workingHours, window } = useFreeBusy()

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
      const id = globalThis.setTimeout(() => setViewTimeZone(calendarTimeZone), 0)
      return () => globalThis.clearTimeout(id)
    }
  }, [calendarTimeZone])

  const effectiveViewTimeZone = viewTimeZone ?? calendarTimeZone ?? 'America/New_York'
  const renderTimeZone = effectiveViewTimeZone

  const hasAvailabilityData = useMemo(() => {
    if (loading) return false
    if (disabledMessage || unavailableMessage) return false
    if (!ownerTimeZone) return false
    return ownerWeeks.flat().length > 0
  }, [disabledMessage, loading, ownerTimeZone, ownerWeeks, unavailableMessage])

  const [availabilityExportGeneratedAtUtcMs, setAvailabilityExportGeneratedAtUtcMs] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    if (disabledMessage || unavailableMessage) return
    if (!ownerTimeZone) return

    const allOwnerDays = ownerWeeks.flat()
    if (allOwnerDays.length === 0) return

    const id = globalThis.setTimeout(() => setAvailabilityExportGeneratedAtUtcMs(Date.now()), 0)
    return () => globalThis.clearTimeout(id)
  }, [disabledMessage, loading, ownerTimeZone, ownerWeeks, unavailableMessage, renderTimeZone, busy, workingHours?.weekly, window])

  const availabilityExportText = useMemo(() => {
    if (loading) return null
    if (disabledMessage || unavailableMessage) return null
    if (!ownerTimeZone) return null

    const allOwnerDays = ownerWeeks.flat()
    if (allOwnerDays.length === 0) return null

    return buildAvailabilityExportText({
      ownerDays: allOwnerDays,
      busy,
      workingHoursWeekly: workingHours?.weekly ?? null,
      ownerTimeZone,
      viewTimeZone: renderTimeZone,
      window,
      generatedAtUtcMs: availabilityExportGeneratedAtUtcMs
    })
  }, [availabilityExportGeneratedAtUtcMs, busy, disabledMessage, loading, ownerTimeZone, ownerWeeks, renderTimeZone, unavailableMessage, workingHours?.weekly, window])

  const availabilityExportFileName = useMemo(() => {
    if (!availabilityExportText) return null

    const start = window?.startDate ?? ownerWeeks.flat()[0]?.ownerDate
    const end = window?.endDateInclusive ?? ownerWeeks.flat().at(-1)?.ownerDate
    const tzSafe = renderTimeZone.replaceAll('/', '-')

    const range = start && end ? `${start}-to-${end}` : 'availability'
    return `availability-${range}-${tzSafe}.txt`
  }, [availabilityExportText, ownerWeeks, renderTimeZone, window?.endDateInclusive, window?.startDate])

  const today = useMemo(
    () => getStartOfDayInTimeZone(new Date(), ownerCalendarTimeZone ?? renderTimeZone),
    [ownerCalendarTimeZone, renderTimeZone]
  )

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <AppHeader
          loading={loading}
          timeZone={effectiveViewTimeZone}
          calendarTimeZone={calendarTimeZone}
          showTimeZoneSelect={hasAvailabilityData}
          showAvailabilityDescription={hasAvailabilityData}
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
            onRefresh={refresh}
            refreshDisabledUntil={refreshDisabledUntil}
            availabilityExportText={availabilityExportText}
            availabilityExportFileName={availabilityExportFileName}
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