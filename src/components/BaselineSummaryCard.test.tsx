import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BaselineSummaryCard } from './BaselineSummaryCard'
import type { PlanTotals } from '../api/types'

function makeTotals(overrides: Partial<PlanTotals> = {}): PlanTotals {
  return {
    total_cost: 1,
    pv_forecast: 0,
    load_forecast: 0,
    clipped: 0,
    soc_percent: 50,
    ...overrides,
  }
}

describe('BaselineSummaryCard', () => {
  it('shows the savings as baseline cost minus actual cost', () => {
    render(<BaselineSummaryCard actual={makeTotals({ total_cost: 1.94 })} baseline={makeTotals({ total_cost: 6.25 })} />)

    expect(screen.getByText('1.94')).toBeInTheDocument()
    expect(screen.getByText('6.25')).toBeInTheDocument()
    expect(screen.getByText('+4.31')).toBeInTheDocument()
  })

  it('shows a negative savings figure when the baseline was cheaper than the actual plan', () => {
    render(<BaselineSummaryCard actual={makeTotals({ total_cost: 6 })} baseline={makeTotals({ total_cost: 5 })} />)

    expect(screen.getByText('-1.00')).toBeInTheDocument()
  })

  it('renders nothing when totals are missing', () => {
    const { container } = render(<BaselineSummaryCard actual={undefined} baseline={makeTotals()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
