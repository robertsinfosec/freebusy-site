export interface BusyBlock {
  start: Date
  end: Date
  summary?: string
  isAllDay?: boolean
}

type ParsedDate = { date: Date; isDateOnly: boolean }

function parseICalDate(dateStr: string): ParsedDate {
  const isDateOnly = !dateStr.includes('T')

  if (!isDateOnly) {
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    const hour = parseInt(dateStr.substring(9, 11))
    const minute = parseInt(dateStr.substring(11, 13))
    const second = parseInt(dateStr.substring(13, 15))
    
    if (dateStr.endsWith('Z')) {
      return { date: new Date(Date.UTC(year, month, day, hour, minute, second)), isDateOnly }
    }
    return { date: new Date(year, month, day, hour, minute, second), isDateOnly }
  }

  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return { date: new Date(year, month, day), isDateOnly }
}

function convertToLocalTime(sourceDate: Date, isDateOnly: boolean): Date {
  if (isDateOnly) return sourceDate
  const localTimeStr = sourceDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
  return new Date(localTimeStr)
}

export function parseICalData(icalText: string): BusyBlock[] {
  const lines = icalText.split(/\r?\n/)
  const events: BusyBlock[] = []
  
  let inEvent = false
  let currentEvent: Partial<BusyBlock> & { summary?: string; startIsDateOnly?: boolean; endIsDateOnly?: boolean } = {}
  
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
      if (currentEvent.start && currentEvent.end) {
        const start = convertToLocalTime(currentEvent.start, !!currentEvent.startIsDateOnly)
        const endRaw = convertToLocalTime(currentEvent.end, !!currentEvent.endIsDateOnly)
        const isAllDay = !!currentEvent.startIsDateOnly

        const end = isAllDay && endRaw.getTime() === start.getTime()
          ? new Date(start.getTime() + 24 * 60 * 60 * 1000)
          : endRaw

        events.push({
          start,
          end,
          summary: currentEvent.summary,
          isAllDay
        })
      }
      inEvent = false
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const dateMatch = line.match(/[:;](\d{8}(T\d{6}Z?)?)/)
        const isDateOnly = line.includes('VALUE=DATE') || !line.includes('T')
        if (dateMatch) {
          const parsed = parseICalDate(dateMatch[1])
          currentEvent.start = parsed.date
          currentEvent.startIsDateOnly = isDateOnly || parsed.isDateOnly
        }
      } else if (line.startsWith('DTEND')) {
        const dateMatch = line.match(/[:;](\d{8}(T\d{6}Z?)?)/)
        const isDateOnly = line.includes('VALUE=DATE') || !line.includes('T')
        if (dateMatch) {
          const parsed = parseICalDate(dateMatch[1])
          currentEvent.end = parsed.date
          currentEvent.endIsDateOnly = isDateOnly || parsed.isDateOnly
        }
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8)
      }
    }
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
