import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlanTable } from './PlanTable'
import { makePlanRow } from '../test/msw/handlers'

describe('PlanTable', () => {
  it('renders one row per plan entry with formatted values', () => {
    const rows = [makePlanRow({ state_text: 'Charging', import_rate: 24.567, soc_percent: 61.4, total_cost: 1.005 })]

    render(<PlanTable rows={rows} />)

    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('24.57')).toBeInTheDocument()
    expect(screen.getByText('61')).toBeInTheDocument()
  })

  it('renders no data rows for an empty plan', () => {
    render(<PlanTable rows={[]} />)

    expect(screen.queryAllByRole('row')).toHaveLength(1) // header row only
  })
})
