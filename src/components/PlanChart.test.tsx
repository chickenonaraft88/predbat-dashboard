import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PlanChart } from './PlanChart'
import { makePlanRow } from '../test/msw/handlers'

// recharts' ResponsiveContainer measures 0x0 in jsdom (no real layout), so it
// renders no SVG content to assert against - these are smoke tests that the
// component mounts and unmounts cleanly with the full prop surface (now,
// hoveredTime, onHoverChange). The hover-matching logic itself is unit
// tested directly in src/lib/chartHover.test.ts.
describe('PlanChart', () => {
  it('renders without crashing for a plain row set', () => {
    expect(() => render(<PlanChart rows={[makePlanRow()]} />)).not.toThrow()
  })

  it('renders without crashing with now/hoveredTime/onHoverChange wired up', () => {
    const onHoverChange = vi.fn()
    const rows = [makePlanRow({ time: '2026-08-26T12:00:00+01:00' }), makePlanRow({ time: '2026-08-26T12:30:00+01:00' })]

    expect(() =>
      render(<PlanChart rows={rows} now={new Date('2026-08-26T12:10:00+01:00')} hoveredTime={rows[1].time} onHoverChange={onHoverChange} />),
    ).not.toThrow()
  })

  it('renders for an empty plan', () => {
    expect(() => render(<PlanChart rows={[]} />)).not.toThrow()
  })
})
