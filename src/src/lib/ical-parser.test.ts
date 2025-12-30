import { describe, expect, it } from 'vitest'

import { mergeBusyBlocks, parseICalData } from '@/lib/ical-parser'

describe('ical-parser', () => {
  it('mergeBusyBlocks merges overlapping blocks', () => {
    const merged = mergeBusyBlocks([
      { start: new Date('2025-12-27T10:00:00Z'), end: new Date('2025-12-27T11:00:00Z') },
      { start: new Date('2025-12-27T10:30:00Z'), end: new Date('2025-12-27T12:00:00Z') }
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].start.toISOString()).toBe('2025-12-27T10:00:00.000Z')
    expect(merged[0].end.toISOString()).toBe('2025-12-27T12:00:00.000Z')
  })

  it('mergeBusyBlocks keeps separated blocks separate', () => {
    const merged = mergeBusyBlocks([
      { start: new Date('2025-12-27T10:00:00Z'), end: new Date('2025-12-27T11:00:00Z') },
      { start: new Date('2025-12-27T12:00:00Z'), end: new Date('2025-12-27T13:00:00Z') }
    ])

    expect(merged).toHaveLength(2)
  })

  it('mergeBusyBlocks merges adjacent blocks (end == start)', () => {
    const merged = mergeBusyBlocks([
      { start: new Date('2025-12-27T10:00:00Z'), end: new Date('2025-12-27T11:00:00Z') },
      { start: new Date('2025-12-27T11:00:00Z'), end: new Date('2025-12-27T12:00:00Z') }
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].start.toISOString()).toBe('2025-12-27T10:00:00.000Z')
    expect(merged[0].end.toISOString()).toBe('2025-12-27T12:00:00.000Z')
  })

  it('parseICalData parses a timed event', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'DTSTART:20251227T100000Z',
      'DTEND:20251227T110000Z',
      'SUMMARY:Test Event',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const events = parseICalData(ics)
    expect(events).toHaveLength(1)
    expect(events[0].summary).toBe('Test Event')
    expect(events[0].isAllDay).toBe(false)
    expect(events[0].start.toISOString()).toBe('2025-12-27T10:00:00.000Z')
    expect(events[0].end.toISOString()).toBe('2025-12-27T11:00:00.000Z')
  })

  it('parseICalData parses TZID local times as UTC instants', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/New_York:20251227T090000',
      'DTEND;TZID=America/New_York:20251227T100000',
      'SUMMARY:NY Meeting',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const events = parseICalData(ics)
    expect(events).toHaveLength(1)
    // 2025-12-27 is EST (UTC-5): 09:00 -> 14:00Z
    expect(events[0].start.toISOString()).toBe('2025-12-27T14:00:00.000Z')
    expect(events[0].end.toISOString()).toBe('2025-12-27T15:00:00.000Z')
  })

  it('parseICalData supports folded lines (continuation lines)', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'DTSTART:20251227T100000Z',
      'DTEND:20251227T110000Z',
      'SUMMARY:Hello',
      ' World',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const events = parseICalData(ics)
    expect(events).toHaveLength(1)
    // The parser concatenates trimmed continuation segments.
    expect(events[0].summary).toBe('HelloWorld')
  })

  it('parseICalData treats VALUE=DATE as all-day and defaults end to +24h when missing', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20251227',
      'SUMMARY:All Day',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const events = parseICalData(ics)
    expect(events).toHaveLength(1)
    expect(events[0].isAllDay).toBe(true)

    const startISO = events[0].start.toISOString().slice(0, 10)
    const endISO = events[0].end.toISOString().slice(0, 10)
    expect(startISO).toBe('2025-12-27')
    expect(endISO).toBe('2025-12-28')
  })
})
