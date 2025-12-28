import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarX, Warning } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WeekSection } from '@/components/WeekSection'

import type { OwnerDay, ParsedBusyInterval, WorkingHoursDayRuleDto } from '@/hooks/freebusy-utils'

interface AvailabilityCardProps {
  today: Date
  busy: ParsedBusyInterval[]
  disabledMessage: string | null
  unavailableMessage: string | null
  ownerWeeks: OwnerDay[][]
  viewTimeZone: string
  ownerTimeZone: string
  weekStartDay?: number | null
  workingHoursWeekly?: WorkingHoursDayRuleDto[] | null
}

export function AvailabilityCard({
  today,
  busy,
  disabledMessage,
  unavailableMessage,
  ownerWeeks,
  viewTimeZone,
  ownerTimeZone,
  weekStartDay = null,
  workingHoursWeekly = null
}: AvailabilityCardProps) {
  const monthLabel = useMemo(() => (
    today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: ownerTimeZone
    })
  ), [ownerTimeZone, today])

  const description = useMemo(() => {
    if (disabledMessage) return 'Free/busy sharing is currently disabled.'
    if (unavailableMessage) return 'We had trouble fetching availability. Please try again later.'

    return busy.length === 0 ? 'No busy blocks scheduled.' : null
  }, [busy.length, disabledMessage, unavailableMessage])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {monthLabel}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {disabledMessage ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-12 text-center text-base text-muted-foreground">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary shadow-inner shadow-primary/10">
              <CalendarX size={64} weight="duotone" />
            </div>
            <p className="font-semibold text-lg text-foreground">Free/busy sharing is turned off.</p>
            <p className="mt-2 text-base">{disabledMessage}</p>
          </div>
        ) : unavailableMessage ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-12 text-center text-base text-muted-foreground">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-200/70 text-amber-800 ring-1 ring-amber-200 shadow-inner shadow-amber-200/50 dark:bg-amber-300/70 dark:text-amber-950 dark:ring-amber-400/60">
              <Warning size={64} weight="duotone" />
            </div>
            <p className="font-semibold text-lg text-foreground">We couldn’t load availability.</p>
            <p className="mt-2 text-base">{unavailableMessage}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {ownerWeeks.map((week, idx) => (
                <motion.div
                  key={week[0]?.ownerDate ?? idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                >
                  <WeekSection
                    ownerDays={week}
                    busy={busy}
                    opacity={1}
                    showTimeLabels={true}
                    viewTimeZone={viewTimeZone}
                    ownerTimeZone={ownerTimeZone}
                    weekStartDay={weekStartDay}
                    workingHoursWeekly={workingHoursWeekly}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
