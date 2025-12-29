export type UsTimeZoneOption = { id: string; label: string }

export const US_TIME_ZONES: UsTimeZoneOption[] = [
  { id: 'America/New_York', label: 'Eastern' },
  { id: 'America/Chicago', label: 'Central' },
  { id: 'America/Denver', label: 'Mountain' },
  { id: 'America/Los_Angeles', label: 'Pacific' },
  { id: 'America/Phoenix', label: 'Arizona' },
  { id: 'America/Anchorage', label: 'Alaska' },
  { id: 'Pacific/Honolulu', label: 'Hawaii' }
]

export function isSupportedUsTimeZone(timeZone: string): boolean {
  return US_TIME_ZONES.some(tz => tz.id === timeZone)
}

export function labelForUsTimeZone(timeZone: string): string {
  return US_TIME_ZONES.find(tz => tz.id === timeZone)?.label ?? timeZone
}
