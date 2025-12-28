import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarX, Warning } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WeekSection } from '@/components/WeekSection'

import type { BusyBlock } from '@/lib/ical-parser'
import type { WorkingScheduleDto } from '@/hooks/freebusy-utils'

interface AvailabilityCardProps {
  today: Date
  busyBlocks: BusyBlock[]
  disabledMessage: string | null
  unavailableMessage: string | null
  weekStarts: Date[]
  windowStart?: Date | null
  windowEnd?: Date | null
  timeZone?: string
  calendarTimeZone?: string | null
  workingSchedule?: WorkingScheduleDto | null
}

export function AvailabilityCard({
  today,
  busyBlocks,
  disabledMessage,
  unavailableMessage,
  weekStarts,
  windowStart = null,
  windowEnd = null,
  timeZone = 'Etc/UTC',
  calendarTimeZone = null,
  workingSchedule = null
}: AvailabilityCardProps) {
  const monthLabel = useMemo(() => (
    today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone
    })
  ), [timeZone, today])

  const description = useMemo(() => {
    if (disabledMessage) return 'Free/busy sharing is currently disabled.'
    if (unavailableMessage) return 'We had trouble fetching availability. Please try again later.'

    return busyBlocks.length === 0 ? 'No busy blocks scheduled.' : null
  }, [busyBlocks.length, disabledMessage, unavailableMessage])

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
              {weekStarts.map((start, idx) => (
                <motion.div
                  key={start.toISOString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                >
                  <WeekSection
                    startDate={start}
                    busyBlocks={busyBlocks}
                    opacity={1}
                    showTimeLabels={true}
                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    timeZone={timeZone}
                    calendarTimeZone={calendarTimeZone}
                    workingSchedule={workingSchedule}
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
