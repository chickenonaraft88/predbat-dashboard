import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlanTable } from './PlanTable'
import { makePlanRow, samplePlanData } from '../test/msw/handlers'
import type { RawPlan } from '../api/types'

function makePlan(overrides: Partial<RawPlan> = {}): RawPlan {
  return {
    ...(samplePlanData.plan as RawPlan),
    ...overrides,
  }
}

describe('PlanTable', () => {
  it('renders one row per plan entry with formatted values', () => {
    const rows = [makePlanRow({ state_text: 'Charging', import_rate: 24.567, soc_percent: 61.4, total_cost: 1.005 })]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('24.57')).toBeInTheDocument()
    expect(screen.getByText('61')).toBeInTheDocument()
  })

  it('renders no data rows for an empty plan', () => {
    render(<PlanTable plan={makePlan({ rows: [] })} />)

    expect(screen.queryAllByRole('row')).toHaveLength(2) // header + totals row only
  })

  it('renders the adjusted rate, PV/load forecast and clipped columns', () => {
    const rows = [
      makePlanRow({
        import_rate_adjusted: 26.1,
        export_rate_adjusted: 14.2,
        pv_forecast: 1.5,
        load_forecast: 0.42,
        clipped: 0.05,
      }),
    ]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(screen.getByText('Import adj')).toBeInTheDocument()
    expect(screen.getByText('Export adj')).toBeInTheDocument()
    expect(screen.getByText('26.10')).toBeInTheDocument()
    expect(screen.getByText('14.20')).toBeInTheDocument()
    expect(screen.getByText('1.50')).toBeInTheDocument()
    expect(screen.getByText('0.42')).toBeInTheDocument()
    expect(screen.getByText('0.05')).toBeInTheDocument()
  })

  it('uses the API-provided totals row when present', () => {
    const rows = [makePlanRow(), makePlanRow({ time: '2026-08-26T12:30:00+01:00' })]
    const plan = makePlan({
      rows,
      totals: { total_cost: 9.87, pv_forecast: 3.2, load_forecast: 1.1, clipped: 0.4, soc_percent: 80 },
    })

    render(<PlanTable plan={plan} />)

    expect(screen.getByText('Totals')).toBeInTheDocument()
    expect(screen.getByText('9.87')).toBeInTheDocument()
    expect(screen.getByText('3.20')).toBeInTheDocument()
  })

  it('falls back to summing rows when totals is absent', () => {
    const rows = [makePlanRow({ pv_forecast: 1, load_forecast: 0.5, clipped: 0.1 }), makePlanRow({ time: '2026-08-26T12:30:00+01:00', pv_forecast: 2, load_forecast: 0.5, clipped: 0.1 })]
    const plan = makePlan({ rows, totals: undefined })

    render(<PlanTable plan={plan} />)

    const totalsRow = screen.getByText('Totals').closest('tr')
    expect(totalsRow).not.toBeNull()
    expect(totalsRow!.textContent).toContain('3.00') // pv_forecast summed
  })

  it('only shows Car/iBoost/Carbon columns when the corresponding plan metadata is set', () => {
    const rows = [makePlanRow({ car_charging: 1.2, iboost: 0.3, carbon_intensity: 120, total_carbon: 0.5 })]

    const { rerender } = render(<PlanTable plan={makePlan({ rows, num_cars: 0, iboost_enable: false, carbon_enable: false })} />)
    expect(screen.queryByText('Car kWh')).not.toBeInTheDocument()
    expect(screen.queryByText('iBoost kWh')).not.toBeInTheDocument()
    expect(screen.queryByText('CO2 g/kWh')).not.toBeInTheDocument()

    rerender(<PlanTable plan={makePlan({ rows, num_cars: 1, iboost_enable: true, carbon_enable: true })} />)
    expect(screen.getByText('Car kWh')).toBeInTheDocument()
    expect(screen.getByText('iBoost kWh')).toBeInTheDocument()
    expect(screen.getByText('CO2 g/kWh')).toBeInTheDocument()
    expect(screen.getByText('CO2 kg')).toBeInTheDocument()
  })
})
