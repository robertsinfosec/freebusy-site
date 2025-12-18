export function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
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

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
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

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function formatTime(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export function getDateRange(startDate: Date, weeks: number) {
  const start = getStartOfDay(startDate)
  const days: Date[] = []
  
  for (let i = 0; i < weeks * 7; i++) {
    days.push(addDays(start, i))
  }
  
  return days
}
