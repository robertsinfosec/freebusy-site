import { describe, expect, it } from 'vitest'

import { US_TIME_ZONES, isSupportedUsTimeZone, labelForUsTimeZone } from '@/lib/us-timezones'

describe('us-timezones', () => {
  it('contains common US zones', () => {
    expect(US_TIME_ZONES.some(z => z.id === 'America/New_York')).toBe(true)
  })

  it('isSupportedUsTimeZone validates membership', () => {
    expect(isSupportedUsTimeZone('America/New_York')).toBe(true)
    expect(isSupportedUsTimeZone('Europe/London')).toBe(false)
  })

  it('labelForUsTimeZone returns a friendly label when known', () => {
    expect(labelForUsTimeZone('America/New_York')).toBe('Eastern')
    expect(labelForUsTimeZone('Europe/London')).toBe('Europe/London')
  })
})
