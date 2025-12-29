export interface BusyBlock {
  start: Date
  end: Date
  summary?: string
  isAllDay?: boolean
  _rawStart?: string
  _rawEnd?: string
}

type ParsedDate = { date: Date; isDateOnly: boolean }

function getOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date)

  const lookup = Object.fromEntries(parts
    .filter(p => p.type !== 'literal')
    .map(p => [p.type, parseInt(p.value, 10)])) as Record<string, number>

  const asUTC = Date.UTC(
    lookup.year,
    (lookup.month ?? 1) - 1,
    lookup.day ?? 1,
    lookup.hour ?? 0,
    lookup.minute ?? 0,
    lookup.second ?? 0
  )

  return (asUTC - date.getTime()) / 60000
}

function parseICalDate(dateStr: string, tzid?: string): ParsedDate {
  const isDateOnly = !dateStr.includes('T')
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  const hour = isDateOnly ? 0 : parseInt(dateStr.substring(9, 11))
  const minute = isDateOnly ? 0 : parseInt(dateStr.substring(11, 13))
  const second = isDateOnly ? 0 : parseInt(dateStr.substring(13, 15))

  if (dateStr.endsWith('Z')) {
    return { date: new Date(Date.UTC(year, month, day, hour, minute, second)), isDateOnly }
  }

  if (tzid) {
    const utcMillis = Date.UTC(year, month, day, hour, minute, second)
    const offsetMinutes = getOffsetMinutes(new Date(utcMillis), tzid)
    return { date: new Date(utcMillis - offsetMinutes * 60_000), isDateOnly }
  }

  // Fallback: interpret as local time when no TZID/Z provided
  return { date: new Date(year, month, day, hour, minute, second), isDateOnly }
}

function convertToLocalTime(sourceDate: Date): Date {
  // Dates are already normalized to the source timezone's absolute instant
  return sourceDate
}

export function parseICalData(icalText: string): BusyBlock[] {
  const lines = icalText.split(/\r?\n/)
  const events: BusyBlock[] = []
  
  let inEvent = false
  let currentEvent: Partial<BusyBlock> & { summary?: string; startIsDateOnly?: boolean; endIsDateOnly?: boolean; _rawStart?: string; _rawEnd?: string } = {}
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++
      line += lines[i].trim()
    }
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      currentEvent = {}
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent.start) {
        const defaultEnd = currentEvent.startIsDateOnly
          ? new Date(currentEvent.start.getTime() + 24 * 60 * 60 * 1000)
          : new Date(currentEvent.start.getTime() + 60 * 60 * 1000)

        const endValue = currentEvent.end ?? defaultEnd

        const start = convertToLocalTime(currentEvent.start)
        const endRaw = convertToLocalTime(endValue)
        const isAllDay = !!currentEvent.startIsDateOnly

        const end = isAllDay && endRaw.getTime() === start.getTime()
          ? new Date(start.getTime() + 24 * 60 * 60 * 1000)
          : endRaw

        events.push({
          start,
          end,
          summary: currentEvent.summary,
          isAllDay,
          _rawStart: currentEvent._rawStart,
          _rawEnd: currentEvent._rawEnd
        })
      }
      inEvent = false
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const dateMatch = line.match(/[:;](\d{8}(T\d{6}Z?)?)/)
        const tzidMatch = line.match(/TZID=([^;:]+)/)
        const isDateOnly = line.includes('VALUE=DATE') || !line.includes('T')
        if (dateMatch) {
          const parsed = parseICalDate(dateMatch[1], tzidMatch?.[1])
          currentEvent.start = parsed.date
          currentEvent.startIsDateOnly = isDateOnly || parsed.isDateOnly
          currentEvent._rawStart = line
        }
      } else if (line.startsWith('DTEND')) {
        const dateMatch = line.match(/[:;](\d{8}(T\d{6}Z?)?)/)
        const tzidMatch = line.match(/TZID=([^;:]+)/)
        const isDateOnly = line.includes('VALUE=DATE') || !line.includes('T')
        if (dateMatch) {
          const parsed = parseICalDate(dateMatch[1], tzidMatch?.[1])
          currentEvent.end = parsed.date
          currentEvent.endIsDateOnly = isDateOnly || parsed.isDateOnly
          currentEvent._rawEnd = line
        }
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8)
      }
    }
  }
  
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_ICAL === 'true') {
    const allDayCount = events.filter(e => e.isAllDay).length
    // Debug: surface parsing results for all-day troubleshooting
    console.debug('[ical-parser] parsed events', {
      total: events.length,
      allDay: allDayCount,
      samples: events.slice(0, 5).map(e => ({
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        isAllDay: e.isAllDay,
        summary: e.summary,
        rawStart: e._rawStart,
        rawEnd: e._rawEnd
      }))
    })
  }

  return events
}

export function mergeBusyBlocks(blocks: BusyBlock[]): BusyBlock[] {
  if (blocks.length === 0) return []
  
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: BusyBlock[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    
    if (current.start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()))
    } else {
      merged.push(current)
    }
  }
  
  return merged
}
