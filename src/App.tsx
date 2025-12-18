import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WeekSection } from '@/components/WeekSection'
import { parseICalData, mergeBusyBlocks, BusyBlock } from '@/lib/ical-parser'
import { getStartOfDay, getStartOfWeek, addDays } from '@/lib/date-utils'
import { Calendar, CaretDown, Warning, ArrowClockwise, CalendarPlus, SunDim, Moon, Monitor, ClockAfternoon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    const resolved = theme === 'system'
      ? (systemTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
      : theme

    root.classList.remove('light', 'dark')
    if (resolved === 'dark') {
      root.classList.add('dark')
      root.dataset.theme = 'dark'
    } else {
      root.classList.add('light')
      root.dataset.theme = 'light'
    }
  }, [theme, systemTheme, mounted])

  const cycleTheme = () => {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']
    const current = theme ?? 'system'
    const next = order[(order.indexOf(current) + 1) % order.length]
    setTheme(next)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        aria-label="Toggle theme"
        disabled
      >
        <Monitor size={18} />
      </Button>
    )
  }

  const icon = theme === 'system'
    ? <Monitor size={18} />
    : theme === 'light'
      ? <SunDim size={18} />
      : <Moon size={18} />

  const label = theme === 'system'
    ? 'System'
    : theme === 'light'
      ? 'Light'
      : 'Dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10"
      onClick={cycleTheme}
      aria-label={`Theme: ${label}`}
      title={`Theme: ${label}`}
    >
      {icon}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function App() {
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWeeks, setShowWeeks] = useState(2)

  const today = useMemo(() => getStartOfDay(new Date()), [])
  const currentWeekStart = useMemo(() => getStartOfWeek(today), [today])
  const nextWeekStart = useMemo(() => addDays(currentWeekStart, 7), [currentWeekStart])
  const thirdWeekStart = useMemo(() => addDays(currentWeekStart, 14), [currentWeekStart])
  const fourthWeekStart = useMemo(() => addDays(currentWeekStart, 21), [currentWeekStart])

  const weekStarts = useMemo(() => [
    currentWeekStart,
    nextWeekStart,
    thirdWeekStart,
    fourthWeekStart
  ], [currentWeekStart, nextWeekStart, thirdWeekStart, fourthWeekStart])

  const fetchCalendar = async () => {
    setLoading(true)
    setError(null)

    try {
      const icalUrl = import.meta.env.VITE_ICAL_URL || import.meta.env.ICAL_URL

      if (!icalUrl) {
        throw new Error('ICAL_URL environment variable is not set')
      }

      const corsProxy = 'https://corsproxy.io/?'
      const response = await fetch(corsProxy + encodeURIComponent(icalUrl))
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.statusText}`)
      }

      const icalText = await response.text()
      const events = parseICalData(icalText)
      const merged = mergeBusyBlocks(events)
      
      setBusyBlocks(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendar()
    
    const interval = setInterval(fetchCalendar, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
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
              <Button
                asChild
                variant="default"
                size="sm"
                className="gap-2"
              >
                <a href="https://cal.com/robertsinfosec" target="_blank" rel="noopener noreferrer">
                  <CalendarPlus size={16} />
                  Book a Meeting
                </a>
              </Button>
              <Button
                onClick={fetchCalendar}
                disabled={loading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-base">
            Real-time availability from my scheduling calendar. Working hours: Mon-Fri, 8am-6pm ET
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm font-semibold text-foreground">
            <ClockAfternoon size={16} className="text-primary" />
            <span>All times shown in Eastern Time (ET).</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <Warning size={20} className="mt-0.5" />
            <AlertDescription className="ml-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCalendar}
                className="ml-4"
              >
                <ArrowClockwise size={16} className="mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-[600px] w-full" />
                <Skeleton className="h-[600px] w-full" />
                <Skeleton className="h-[600px] w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {today.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <CardDescription>
                Showing {showWeeks} week{showWeeks > 1 ? 's' : ''} of availability. 
                {busyBlocks.length === 0 && ' No busy blocks scheduled.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {weekStarts.slice(0, showWeeks).map((start, idx) => (
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
                    />
                  </motion.div>
                ))}
              </div>

              {showWeeks < 4 && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowWeeks(4)}
                    size="lg"
                    className="gap-2 shadow-lg hover:shadow-accent/20"
                  >
                    <CaretDown size={20} />
                    Show More (up to 4 weeks)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Calendar updates every 5 minutes · Last updated: {new Date().toLocaleTimeString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}

export default App