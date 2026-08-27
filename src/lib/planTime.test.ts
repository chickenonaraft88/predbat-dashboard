import { describe, expect, it } from 'vitest'

import { findCurrentRowIndex, findNowRowTime, isPlanStale } from './planTime'
import { makePlanRow } from '../test/msw/handlers'

const rows = [
  makePlanRow({ time: '2026-08-26T12:00:00+01:00' }),
  makePlanRow({ time: '2026-08-26T12:30:00+01:00' }),
  makePlanRow({ time: '2026-08-26T13:00:00+01:00' }),
]

describe('findCurrentRowIndex', () => {
  it('finds the row whose slot contains now', () => {
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T12:15:00+01:00'))).toBe(0)
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T12:30:00+01:00'))).toBe(1)
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T12:59:00+01:00'))).toBe(1)
  })

  it('uses a 30-minute default slot length for the last row', () => {
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T13:29:00+01:00'))).toBe(2)
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T13:30:00+01:00'))).toBe(-1)
  })

  it('returns -1 when now is before the plan starts', () => {
    expect(findCurrentRowIndex(rows, new Date('2026-08-26T11:00:00+01:00'))).toBe(-1)
  })

  it('returns -1 for an empty plan', () => {
    expect(findCurrentRowIndex([], new Date())).toBe(-1)
  })
})

describe('findNowRowTime', () => {
  it('returns the current row time when now is within the plan', () => {
    expect(findNowRowTime(rows, new Date('2026-08-26T12:45:00+01:00'))).toBe('2026-08-26T12:30:00+01:00')
  })

  it('pins to the last row once now is past the end of the plan', () => {
    expect(findNowRowTime(rows, new Date('2026-08-27T00:00:00+01:00'))).toBe('2026-08-26T13:00:00+01:00')
  })

  it('returns undefined when now is before the plan starts', () => {
    expect(findNowRowTime(rows, new Date('2026-08-26T11:00:00+01:00'))).toBeUndefined()
  })

  it('returns undefined for an empty plan', () => {
    expect(findNowRowTime([], new Date())).toBeUndefined()
  })
})

describe('isPlanStale', () => {
  const timestamp = '2026-08-26T12:00:00+01:00'

  it('is not stale within 15 minutes', () => {
    expect(isPlanStale(timestamp, new Date('2026-08-26T12:14:00+01:00'))).toBe(false)
  })

  it('is stale beyond 15 minutes', () => {
    expect(isPlanStale(timestamp, new Date('2026-08-26T12:16:00+01:00'))).toBe(true)
  })
})
