import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HistoryTable } from './HistoryTable'
import { makePlanRow } from '../test/msw/handlers'

describe('HistoryTable', () => {
  it('shows target vs actual SOC and the difference for a row with a target', () => {
    const rows = [makePlanRow({ state_text: 'Charging', state_target: '80', soc_percent: 75 })]

    render(<HistoryTable rows={rows} />)

    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('-5')).toBeInTheDocument()
  })

  it('renders a placeholder difference for rows with no target set', () => {
    const rows = [makePlanRow({ state_target: null, soc_percent: 62 })]

    render(<HistoryTable rows={rows} />)

    const cells = screen.getAllByText('-')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('renders no data rows for an empty history', () => {
    render(<HistoryTable rows={[]} />)

    expect(screen.queryAllByRole('row')).toHaveLength(1) // header row only
  })
})
