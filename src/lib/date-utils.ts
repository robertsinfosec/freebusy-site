export function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getUTCStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

export type TimeZoneParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
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

  const lookup = Object.fromEntries(
    parts
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, parseInt(p.value, 10)])
  ) as Record<string, number>

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

export function getTimeZoneParts(date: Date, timeZone: string): TimeZoneParts {
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

  const lookup = Object.fromEntries(
    parts
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, parseInt(p.value, 10)])
  ) as Record<string, number>

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour ?? 0,
    minute: lookup.minute ?? 0,
    second: lookup.second ?? 0
  }
}

export function getTimeZoneWeekday(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[weekday] ?? 0
}

export function makeDateInTimeZone(parts: {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
}, timeZone: string): Date {
  const utcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
    0
  )

  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcMillis), timeZone)
  return new Date(utcMillis - offsetMinutes * 60_000)
}

export function getStartOfDayInTimeZone(date: Date, timeZone: string): Date {
  const p = getTimeZoneParts(date, timeZone)
  return makeDateInTimeZone({ year: p.year, month: p.month, day: p.day, hour: 0, minute: 0, second: 0 }, timeZone)
}

export function addDaysInTimeZone(date: Date, days: number, timeZone: string): Date {
  const p = getTimeZoneParts(date, timeZone)
  const utc = new Date(Date.UTC(p.year, p.month - 1, p.day + days, 0, 0, 0, 0))
  return makeDateInTimeZone(
    { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate(), hour: 0, minute: 0, second: 0 },
    timeZone
  )
}

export function getStartOfWeekInTimeZone(date: Date, timeZone: string): Date {
  const startOfDay = getStartOfDayInTimeZone(date, timeZone)
  const weekday = getTimeZoneWeekday(startOfDay, timeZone) // Sunday = 0
  return addDaysInTimeZone(startOfDay, -weekday, timeZone)
}

export function isWeekendInTimeZone(date: Date, timeZone: string): boolean {
  const day = getTimeZoneWeekday(date, timeZone)
  return day === 0 || day === 6
}

export function formatDateHeaderInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function formatTimePartsForDisplay(hour24: number, minute: number): string {
  let hours = hour24
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const minuteStr = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''
  return `${hours}${minuteStr} ${ampm}`
}

export function formatTimeRangeInTimeZone(start: Date, end: Date, timeZone: string): string {
  const s = getTimeZoneParts(start, timeZone)
  const e = getTimeZoneParts(end, timeZone)
  return `${formatTimePartsForDisplay(s.hour, s.minute)} - ${formatTimePartsForDisplay(e.hour, e.minute)}`
}

export function getTimeZoneDisplayName(date: Date, timeZone: string, style: 'short' | 'long' = 'short'): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: style
  }).formatToParts(date)

  const tzPart = parts.find(p => p.type === 'timeZoneName')
  return tzPart?.value ?? timeZone
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addUTCDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isSameUTCDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  )
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isUTCWeekend(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

export function getWorkingHours() {
  return { start: 8, end: 18 }
}

export function isWorkingHour(hour: number, date: Date): boolean {
  if (isWeekend(date)) return false
  const { start, end } = getWorkingHours()
  return hour >= start && hour < end
}

export function isUTCWorkingHour(hour: number, date: Date): boolean {
  if (isUTCWeekend(date)) return false
  const { start, end } = getWorkingHours()
  return hour >= start && hour < end
}

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function formatUTCDateHeader(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function formatTime(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export function formatUTCTime(hour: number): string {
  return formatTime(hour)
}

export function formatTimeRange(start: Date, end: Date): string {
  const formatDateTime = (date: Date): string => {
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    const minuteStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''
    return `${hours}${minuteStr} ${ampm}`
  }
  
  return `${formatDateTime(start)} - ${formatDateTime(end)}`
}

export function formatUTCTimeRange(start: Date, end: Date): string {
  const formatDateTime = (date: Date): string => {
    let hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    const minuteStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''
    return `${hours}${minuteStr} ${ampm}`
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`
}

export function getStartOfWeek(date: Date): Date {
  const d = getStartOfDay(date)
  const day = d.getDay()
  const diff = day
  return addDays(d, -diff)
}

export function getUTCStartOfWeek(date: Date): Date {
  const d = getUTCStartOfDay(date)
  const day = d.getUTCDay()
  return addUTCDays(d, -day)
}

export function getDateRange(startDate: Date, weeks: number) {
  const start = getStartOfDay(startDate)
  const days: Date[] = []
  
  for (let i = 0; i < weeks * 7; i++) {
    days.push(addDays(start, i))
  }
  
  return days
}
