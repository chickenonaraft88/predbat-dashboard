import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanTable } from './PlanTable'
import { DEFAULT_BASE_URL } from '../api/connection'
import type { PlanOverrides, RawPlan } from '../api/types'
import { makePlanRow, samplePlanData } from '../test/msw/handlers'
import { renderWithProviders } from '../test/renderWithProviders'
import { server } from '../test/msw/server'

function render(ui: ReactElement) {
  return renderWithProviders(ui)
}

function makePlan(overrides: Partial<RawPlan> = {}): RawPlan {
  return {
    ...(samplePlanData.plan as RawPlan),
    ...overrides,
  }
}

const noOverrides: PlanOverrides = {
  manual_charge_times: [],
  manual_export_times: [],
  manual_freeze_charge_times: [],
  manual_freeze_export_times: [],
  manual_demand_times: [],
  manual_import_rates: [],
  manual_export_rates: [],
  manual_load_adjust: [],
  manual_soc: [],
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

  it('renders the PV/load forecast columns', () => {
    const rows = [makePlanRow({ pv_forecast: 1.5, load_forecast: 0.42 })]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(screen.getByText('PV kWh')).toBeInTheDocument()
    expect(screen.getByText('Load kWh')).toBeInTheDocument()
    expect(screen.getByText('1.50')).toBeInTheDocument()
    expect(screen.getByText('0.42')).toBeInTheDocument()
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

  it.each([
    ['Chrg', '#3AEE85'],
    ['HoldChrg', '#34DBEB'],
    ['FrzChrg', '#EEEEEE'],
    ['Exp', '#FFFF00'],
    ['HoldExp', '#FFFF00'],
    ['FrzExp', '#AAAAAA'],
    ['Idle', '#FFFFFF'],
  ])('colours the state cell background for %s state', (stateText, expectedColor) => {
    const rows = [makePlanRow({ state_text: stateText, state_color: expectedColor })]

    render(<PlanTable plan={makePlan({ rows })} />)

    const cell = screen.getByTestId('state-single')
    expect(cell).toHaveStyle({ backgroundColor: expectedColor })
  })

  it('colours import/export rate cells using the API-provided rate_color fields', () => {
    const rows = [
      makePlanRow({
        import_rate: 45,
        rate_color_import: '#F18261',
        export_rate: 2,
        rate_color_export: '#dcdcdc',
      }),
    ]

    render(<PlanTable plan={makePlan({ rows })} />)

    const importCell = screen.getByText('45.00').closest('td')
    const exportCell = screen.getByText('2.00').closest('td')
    expect(importCell).not.toBeNull()
    expect(exportCell).not.toBeNull()
    expect(importCell!).toHaveStyle({ backgroundColor: '#F18261' })
    expect(exportCell!).toHaveStyle({ backgroundColor: '#dcdcdc' })
  })

  it('renders a single-tone state cell when state2_text is not set', () => {
    const rows = [makePlanRow({ state_text: 'Chrg', state_color: '#3AEE85', state2_text: null, state2_color: null })]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(screen.queryByTestId('state-split')).not.toBeInTheDocument()
    expect(screen.getByTestId('state-cell')).toHaveTextContent('Chrg')
  })

  it('renders a split two-tone state cell when state2_text/state2_color are set', () => {
    const rows = [
      makePlanRow({
        state_text: 'Chrg',
        state_color: '#3AEE85',
        state2_text: 'FrzExp',
        state2_color: '#AAAAAA',
      }),
    ]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(screen.getByTestId('state-split')).toBeInTheDocument()
    const half1 = screen.getByTestId('state-half-1')
    const half2 = screen.getByTestId('state-half-2')
    expect(half1).toHaveTextContent('Chrg')
    expect(half1).toHaveStyle({ backgroundColor: '#3AEE85' })
    expect(half2).toHaveTextContent('FrzExp')
    expect(half2).toHaveStyle({ backgroundColor: '#AAAAAA' })
  })

  it('expands a row reason against reason_templates and shows it in a tooltip on hover', async () => {
    const user = userEvent.setup()
    const rows = [
      makePlanRow({
        state_text: 'Chrg',
        reasons: [{ code: 'charge_low_rate', params: { target_percent: 80, rate_kw: '3.50', rate: '12.34' } }],
      }),
    ]
    const plan = makePlan({
      rows,
      reason_templates: {
        charge_low_rate: 'Charging up to {target_percent}% at {rate_kw}kW at the import rate for this slot of ({rate}p/kWh).',
      },
    })

    render(<PlanTable plan={plan} />)

    await user.hover(within(screen.getByTestId('state-cell')).getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Charging up to 80% at 3.50kW at the import rate for this slot of (12.34p/kWh).')
  })

  it('does not render a reason trigger when a row has no reasons', () => {
    const rows = [makePlanRow({ reasons: [] })]

    render(<PlanTable plan={makePlan({ rows })} />)

    expect(within(screen.getByTestId('state-cell')).queryByRole('button')).not.toBeInTheDocument()
  })

  describe('the "now" row', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('highlights the row whose slot contains the mocked current time', () => {
      vi.setSystemTime(new Date('2026-08-26T12:45:00+01:00'))
      const rows = [
        makePlanRow({ time: '2026-08-26T12:00:00+01:00', state_text: 'Before' }),
        makePlanRow({ time: '2026-08-26T12:30:00+01:00', state_text: 'DuringNow' }),
        makePlanRow({ time: '2026-08-26T13:00:00+01:00', state_text: 'After' }),
      ]

      render(<PlanTable plan={makePlan({ rows })} />)

      const nowRow = screen.getByTestId('now-row')
      expect(nowRow).toHaveAttribute('aria-current', 'time')
      expect(nowRow.textContent).toContain('DuringNow')
    })

    it('does not highlight any row when now falls outside the plan', () => {
      vi.setSystemTime(new Date('2026-08-26T09:00:00+01:00'))
      const rows = [makePlanRow({ time: '2026-08-26T12:00:00+01:00' })]

      render(<PlanTable plan={makePlan({ rows })} />)

      expect(screen.queryByTestId('now-row')).not.toBeInTheDocument()
    })
  })

  describe('hover sync', () => {
    it('calls onHoverRow with the row time on mouse enter, and null on mouse leave', () => {
      const onHoverRow = vi.fn()
      const rows = [makePlanRow({ time: '2026-08-26T12:00:00+01:00', state_text: 'Row0' }), makePlanRow({ time: '2026-08-26T12:30:00+01:00', state_text: 'Row1' })]

      render(<PlanTable plan={makePlan({ rows })} onHoverRow={onHoverRow} />)

      const targetRow = screen.getByText('Row1').closest('tr')!
      fireEvent.mouseEnter(targetRow)
      expect(onHoverRow).toHaveBeenCalledWith('2026-08-26T12:30:00+01:00')

      fireEvent.mouseLeave(targetRow)
      expect(onHoverRow).toHaveBeenCalledWith(null)
    })

    it('highlights the row matching hoveredTime', () => {
      const rows = [makePlanRow({ time: '2026-08-26T12:00:00+01:00', state_text: 'Row0' }), makePlanRow({ time: '2026-08-26T12:30:00+01:00', state_text: 'Row1' })]

      render(<PlanTable plan={makePlan({ rows })} hoveredTime="2026-08-26T12:30:00+01:00" />)

      const hoveredRow = screen.getByTestId('hovered-row')
      expect(hoveredRow.textContent).toContain('Row1')
    })

    it('highlights no row when hoveredTime is null', () => {
      const rows = [makePlanRow({ time: '2026-08-26T12:00:00+01:00' })]

      render(<PlanTable plan={makePlan({ rows })} hoveredTime={null} />)

      expect(screen.queryByTestId('hovered-row')).not.toBeInTheDocument()
    })
  })

  describe('debug columns', () => {
    it('hides the effective rate, PV10/Load10, clipped and XLoad columns by default', () => {
      const rows = [makePlanRow()]
      render(<PlanTable plan={makePlan({ rows })} />)

      expect(screen.queryByText('Import eff')).not.toBeInTheDocument()
      expect(screen.queryByText('Export eff')).not.toBeInTheDocument()
      expect(screen.queryByText('PV10 kWh')).not.toBeInTheDocument()
      expect(screen.queryByText('Load10 kWh')).not.toBeInTheDocument()
      expect(screen.queryByText('Clip kWh')).not.toBeInTheDocument()
      expect(screen.queryByText('XLoad kWh')).not.toBeInTheDocument()
    })

    it('shows the debug columns with their values when debugColumns is true', () => {
      const rows = [
        makePlanRow({
          import_rate_adjusted: 27.1,
          export_rate_adjusted: 13.4,
          pv_forecast10: 0.3,
          load_forecast10: 0.15,
          clipped: 0.02,
          extra_load: 0.4,
        }),
      ]

      render(<PlanTable plan={makePlan({ rows })} debugColumns />)

      expect(screen.getByText('Import eff')).toBeInTheDocument()
      expect(screen.getByText('27.10')).toBeInTheDocument()
      expect(screen.getByText('Export eff')).toBeInTheDocument()
      expect(screen.getByText('13.40')).toBeInTheDocument()
      expect(screen.getByText('PV10 kWh')).toBeInTheDocument()
      expect(screen.getByText('0.30')).toBeInTheDocument()
      expect(screen.getByText('Load10 kWh')).toBeInTheDocument()
      expect(screen.getByText('0.15')).toBeInTheDocument()
      expect(screen.getByText('Clip kWh')).toBeInTheDocument()
      expect(screen.getByText('XLoad kWh')).toBeInTheDocument()
      expect(screen.getByText('0.40')).toBeInTheDocument()
    })
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

  describe('plan override menu (#15)', () => {
    it('opens on the Time cell with the manual state options', async () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00' })]
      render(<PlanTable plan={makePlan({ rows })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: 'Override Wed 14:30 slot' }))

      const menu = screen.getByRole('menu')
      expect(menu).toBeInTheDocument()
      for (const label of ['Manual Demand', 'Manual Charge', 'Manual Export', 'Manual Freeze Charge', 'Manual Freeze Export', 'Clear']) {
        expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument()
      }
    })

    it('posts the right payload when a state override is chosen', async () => {
      let body: URLSearchParams | undefined
      server.use(
        http.post(`${DEFAULT_BASE_URL}/plan_override`, async ({ request }) => {
          body = new URLSearchParams(await request.text())
          return HttpResponse.json({ success: true })
        }),
      )

      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00' })]
      render(<PlanTable plan={makePlan({ rows })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: 'Override Wed 14:30 slot' }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Manual Charge' }))

      await waitFor(() => expect(body?.get('time')).toBe('Wed 14:30'))
      expect(body?.get('action')).toBe('Manual Charge')
    })

    it('reflects an active override from the overrides prop', () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00', slot_minute: 870 })]
      const overrides: PlanOverrides = { ...noOverrides, manual_charge_times: [870] }

      render(<PlanTable plan={makePlan({ rows })} overrides={overrides} />)

      expect(screen.getByRole('button', { name: 'Override Wed 14:30 slot' })).toHaveTextContent('Manual Charge')
    })
  })

  describe('value override menus (#16)', () => {
    const row = () => makePlanRow({ time: '2026-08-26T14:30:00+01:00', slot_minute: 870, import_rate: 24.5, export_rate: 15, soc_percent: 62, load_forecast: 0.2 })

    async function captureRateOverrideBody() {
      let body: URLSearchParams | undefined
      server.use(
        http.post(`${DEFAULT_BASE_URL}/rate_override`, async ({ request }) => {
          body = new URLSearchParams(await request.text())
          return HttpResponse.json({ success: true })
        }),
      )
      return () => body
    }

    it('posts the right payload from the import rate cell', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable plan={makePlan({ rows: [row()] })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override import rate/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Set Import Rate' }))
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Set Import Rate value' }), '30')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(getBody()?.get('rate')).toBe('30'))
      expect(getBody()?.get('time')).toBe('Wed 14:30')
      expect(getBody()?.get('action')).toBe('Set Import')
    })

    it('posts the right payload from the export rate cell', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable plan={makePlan({ rows: [row()] })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override export rate/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Set Export Rate' }))
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Set Export Rate value' }), '5')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(getBody()?.get('action')).toBe('Set Export'))
      expect(getBody()?.get('rate')).toBe('5')
    })

    it('posts the right payload from the SOC cell', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable plan={makePlan({ rows: [row()] })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override SOC/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Set SOC' }))
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Set SOC value' }), '80')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(getBody()?.get('action')).toBe('Set SOC'))
      expect(getBody()?.get('rate')).toBe('80')
    })

    it('posts the right payload from the load cell, including a Clear', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable plan={makePlan({ rows: [row()] })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override load/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Clear Load' }))

      await waitFor(() => expect(getBody()?.get('action')).toBe('Clear Load'))
      expect(getBody()?.get('time')).toBe('Wed 14:30')
    })

    it('reflects active value overrides from the overrides prop', () => {
      const overrides: PlanOverrides = {
        ...noOverrides,
        manual_import_rates: [{ minutes: 870, rate: 45 }],
        manual_export_rates: [{ minutes: 870, rate: 8 }],
        manual_soc: [{ minutes: 870, target: 90 }],
        manual_load_adjust: [{ minutes: 870, adjustment: 1.5 }],
      }

      render(<PlanTable plan={makePlan({ rows: [row()] })} overrides={overrides} />)

      expect(screen.getByRole('button', { name: /Override import rate/ })).toHaveTextContent('45.00')
      expect(screen.getByRole('button', { name: /Override export rate/ })).toHaveTextContent('8.00')
      expect(screen.getByRole('button', { name: /Override SOC/ })).toHaveTextContent('90')
      expect(screen.getByRole('button', { name: /Override load/ })).toHaveTextContent('1.50')
    })
  })
})
