import { describe, expect, it } from 'vitest'

import { formatOverrideTime } from './time'

describe('formatOverrideTime', () => {
  it('formats an ISO timestamp as "<Weekday> HH:MM"', () => {
    // 2026-08-26 is a Wednesday.
    expect(formatOverrideTime('2026-08-26T14:30:00+01:00')).toBe('Wed 14:30')
  })

  it('uses the calendar date/time embedded in the string, not the offset value', () => {
    expect(formatOverrideTime('2026-08-30T00:15:00+00:00')).toBe('Sun 00:15')
  })

  it('ignores a browser-local timezone difference by anchoring the weekday to the string itself', () => {
    // A negative offset far from UTC would shift the calendar date under naive
    // local-time parsing; the wall-clock date/time in the string is authoritative.
    expect(formatOverrideTime('2026-08-27T23:45:00-08:00')).toBe('Thu 23:45')
  })

  it('throws for a string that is not an ISO timestamp', () => {
    expect(() => formatOverrideTime('not-a-date')).toThrow(/cannot parse/i)
  })
})
