import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowClockwise, CalendarX, CaretDown, CopySimple, DotsThreeVertical, DownloadSimple, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { WeekSection } from '@/components/WeekSection'
import { useIsMobile } from '@/hooks/use-mobile'

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

  onRefresh: () => void
  refreshDisabledUntil?: string | null
  availabilityExportText?: string | null
  availabilityExportFileName?: string | null
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
  workingHoursWeekly = null,
  onRefresh,
  refreshDisabledUntil = null,
  availabilityExportText = null,
  availabilityExportFileName = null
}: AvailabilityCardProps) {
  const isMobile = useIsMobile()

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

  const exportDisabled = !availabilityExportText

  const disabledUntilMs = refreshDisabledUntil ? new Date(refreshDisabledUntil).getTime() : null
  const [rateLimited, setRateLimited] = useState(() => disabledUntilMs !== null)

  useEffect(() => {
    if (disabledUntilMs === null || !Number.isFinite(disabledUntilMs)) {
      const id = globalThis.setTimeout(() => setRateLimited(false), 0)
      return () => globalThis.clearTimeout(id)
    }

    const update = () => {
      setRateLimited(disabledUntilMs > Date.now())
    }

    const immediateId = globalThis.setTimeout(update, 0)
    const remainingMs = disabledUntilMs - Date.now()
    const timeoutMs = Math.max(0, Math.min(remainingMs + 50, 2_000_000_000))
    const id = globalThis.setTimeout(update, timeoutMs)
    return () => {
      globalThis.clearTimeout(immediateId)
      globalThis.clearTimeout(id)
    }
  }, [disabledUntilMs])
  const refreshTitle = rateLimited && disabledUntilMs
    ? `Rate limited until ${new Date(disabledUntilMs).toLocaleTimeString('en-US', { timeZone: viewTimeZone })}`
    : 'Refresh'

  const refreshDisabled = rateLimited

  const copyAvailability = async () => {
    if (!availabilityExportText) return

    const success = async (): Promise<boolean> => {
      const clipboard = globalThis.navigator?.clipboard
      const writeText = clipboard?.writeText

      if (typeof writeText === 'function') {
        try {
          await writeText.call(clipboard, availabilityExportText)
          return true
        } catch {
          // Fall back
        }
      }

      try {
        const el = document.createElement('textarea')
        el.value = availabilityExportText
        el.setAttribute('readonly', 'true')
        el.style.position = 'fixed'
        el.style.left = '-9999px'
        el.style.top = '0'
        document.body.appendChild(el)
        el.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(el)
        return ok
      } catch {
        return false
      }
    }

    const ok = await success()
    if (ok) toast.success('Copied to clipboard')
    else toast.error('Could not copy')
  }

  const downloadAvailability = () => {
    if (!availabilityExportText) return

    const fileName = availabilityExportFileName || 'availability.txt'
    const blob = new Blob([availabilityExportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {monthLabel}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
        <CardAction>
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Availability actions" title="Actions">
                  <DotsThreeVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!exportDisabled ? (
                  <>
                    <DropdownMenuItem onClick={copyAvailability}>
                      <CopySimple size={16} />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAvailability}>
                      <DownloadSimple size={16} />
                      Download (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={onRefresh} disabled={refreshDisabled} title={refreshTitle}>
                  <ArrowClockwise size={16} />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!exportDisabled ? (
                <div className="inline-flex">
                  <Button
                    onClick={copyAvailability}
                    variant="outline"
                    size="sm"
                    className="rounded-r-none"
                    title="Copy availability"
                  >
                    <CopySimple size={16} />
                    Copy
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-l-none border-l-0 px-2"
                        aria-label="Copy options"
                        title="More copy options"
                      >
                        <CaretDown size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={downloadAvailability}>
                        <DownloadSimple size={16} />
                        Download (.txt)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}
              <Button
                onClick={onRefresh}
                disabled={refreshDisabled}
                variant="outline"
                size="sm"
                title={refreshTitle}
              >
                <ArrowClockwise size={16} />
                Refresh
              </Button>
            </div>
          )}
        </CardAction>
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
