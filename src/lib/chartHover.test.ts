import { describe, expect, it } from 'vitest'

import { resolveHoveredRowTime } from './chartHover'

const points = [
  { time: '12:00', rawTime: '2026-08-26T12:00:00+01:00' },
  { time: '12:30', rawTime: '2026-08-26T12:30:00+01:00' },
]

describe('resolveHoveredRowTime', () => {
  it('maps an active label back to the matching row time', () => {
    expect(resolveHoveredRowTime(points, '12:30')).toBe('2026-08-26T12:30:00+01:00')
  })

  it('returns null when the label matches no point', () => {
    expect(resolveHoveredRowTime(points, '13:00')).toBeNull()
  })

  it('returns null when there is no active label', () => {
    expect(resolveHoveredRowTime(points, undefined)).toBeNull()
  })

  it('coerces a numeric label before comparing', () => {
    const numericPoints = [{ time: '5', rawTime: '2026-08-26T00:05:00+01:00' }]
    expect(resolveHoveredRowTime(numericPoints, 5)).toBe('2026-08-26T00:05:00+01:00')
  })
})
