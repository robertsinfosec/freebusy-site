import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WeekSection } from '@/components/WeekSection'
import { parseICalData, mergeBusyBlocks, BusyBlock } from '@/lib/ical-parser'
import { getStartOfDay, getStartOfWeek, addDays } from '@/lib/date-utils'
import { Calendar, CaretDown, Warning, ArrowClockwise } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showThirdWeek, setShowThirdWeek] = useState(false)

  const today = useMemo(() => getStartOfDay(new Date()), [])
  const currentWeekStart = useMemo(() => getStartOfWeek(today), [today])
  const nextWeekStart = useMemo(() => addDays(currentWeekStart, 7), [currentWeekStart])
  const thirdWeekStart = useMemo(() => addDays(currentWeekStart, 14), [currentWeekStart])

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar size={32} weight="duotone" className="text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                robertsinfosec Free/Busy
              </h1>
            </div>
            <Button
              onClick={fetchCalendar}
              disabled={loading}
              variant="outline"
              size="default"
              className="gap-2"
            >
              <ArrowClockwise size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground text-base">
            Real-time availability from ProtonMail calendar. Working hours: Mon-Fri, 8am-6pm ET
          </p>
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
                Showing {showThirdWeek ? '3' : '2'} weeks of availability. 
                {busyBlocks.length === 0 && ' No busy blocks scheduled.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <WeekSection
                  startDate={currentWeekStart}
                  busyBlocks={busyBlocks}
                  opacity={1}
                  showTimeLabels={true}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <WeekSection
                  startDate={nextWeekStart}
                  busyBlocks={busyBlocks}
                  opacity={1}
                  showTimeLabels={true}
                />
              </motion.div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  {!showThirdWeek ? (
                    <motion.div
                      key="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <WeekSection
                        startDate={thirdWeekStart}
                        busyBlocks={busyBlocks}
                        opacity={0.3}
                        showTimeLabels={true}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <Button
                          onClick={() => setShowThirdWeek(true)}
                          size="lg"
                          className="shadow-lg hover:shadow-accent/20"
                        >
                          <CaretDown size={20} className="mr-2" />
                          Show More
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="weeks"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WeekSection
                        startDate={thirdWeekStart}
                        busyBlocks={busyBlocks}
                        opacity={1}
                        showTimeLabels={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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