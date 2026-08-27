import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanTableMobile } from './PlanTableMobile'
import { DEFAULT_BASE_URL } from '../api/connection'
import type { PlanOverrides, RawPlan } from '../api/types'
import { makePlanRow, samplePlanData } from '../test/msw/handlers'
import { renderWithProviders } from '../test/renderWithProviders'
import { server } from '../test/msw/server'

function renderMobile(ui: ReactElement) {
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

describe('PlanTableMobile', () => {
  it('renders a two-line card per row: time/cost, then state/rate summary', () => {
    const rows = [makePlanRow({ state_text: 'Charging', import_rate: 24.567, soc_percent: 61.4, total_cost: 1.005 })]

    renderMobile(<PlanTableMobile plan={makePlan({ rows })} />)

    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('1.00')).toBeInTheDocument()
    expect(screen.getByText(/24\.57p/)).toBeInTheDocument()
    expect(screen.getByText(/SOC 61%/)).toBeInTheDocument()
  })

  it('renders a split two-tone state chip when state2_text/state2_color are set', () => {
    const rows = [makePlanRow({ state_text: 'Chrg', state_color: '#3AEE85', state2_text: 'FrzExp', state2_color: '#AAAAAA' })]

    renderMobile(<PlanTableMobile plan={makePlan({ rows })} />)

    expect(screen.getByTestId('mobile-state-split')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-state-half-1')).toHaveTextContent('Chrg')
    expect(screen.getByTestId('mobile-state-half-2')).toHaveTextContent('FrzExp')
  })

  it('starts collapsed and expands PV/Load/Export/Total detail on tap', async () => {
    const user = userEvent.setup()
    const rows = [makePlanRow({ pv_forecast: 1.5, load_forecast: 0.42, export_rate: 9.9 })]

    renderMobile(<PlanTableMobile plan={makePlan({ rows })} />)

    expect(screen.queryByTestId('mobile-row-detail')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /SOC/ }))

    const detail = screen.getByTestId('mobile-row-detail')
    expect(within(detail).getByText('1.50')).toBeInTheDocument() // PV
    expect(within(detail).getByText('0.42')).toBeInTheDocument() // Load
    expect(within(detail).getByText('9.90')).toBeInTheDocument() // Export rate
  })

  it('only shows Car/iBoost/Carbon detail fields when the corresponding plan metadata is set', async () => {
    const user = userEvent.setup()
    const rows = [makePlanRow({ car_charging: 1.2, iboost: 0.3, carbon_intensity: 120, total_carbon: 0.5 })]

    renderMobile(<PlanTableMobile plan={makePlan({ rows, num_cars: 1, iboost_enable: true, carbon_enable: true })} />)
    await user.click(screen.getByRole('button', { name: /SOC/ }))

    expect(screen.getByText('Car kWh')).toBeInTheDocument()
    expect(screen.getByText('iBoost kWh')).toBeInTheDocument()
    expect(screen.getByText('CO2 g/kWh')).toBeInTheDocument()
    expect(screen.getByText('CO2 kg')).toBeInTheDocument()
  })

  it('shows debug fields in the expanded detail only when debugColumns is true', async () => {
    const user = userEvent.setup()
    const rows = [makePlanRow({ import_rate_adjusted: 27.1, clipped: 0.02 })]

    renderMobile(<PlanTableMobile plan={makePlan({ rows })} debugColumns />)
    await user.click(screen.getByRole('button', { name: /SOC/ }))

    expect(screen.getByText('Import eff')).toBeInTheDocument()
    expect(screen.getByText('27.10')).toBeInTheDocument()
    expect(screen.getByText('Clip kWh')).toBeInTheDocument()
  })

  describe('the "now" row', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('highlights the card whose slot contains the mocked current time', () => {
      vi.setSystemTime(new Date('2026-08-26T12:45:00+01:00'))
      const rows = [
        makePlanRow({ time: '2026-08-26T12:00:00+01:00', state_text: 'Before' }),
        makePlanRow({ time: '2026-08-26T12:30:00+01:00', state_text: 'DuringNow' }),
        makePlanRow({ time: '2026-08-26T13:00:00+01:00', state_text: 'After' }),
      ]

      renderMobile(<PlanTableMobile plan={makePlan({ rows })} />)

      const nowRow = screen.getByTestId('mobile-now-row')
      expect(nowRow).toHaveAttribute('aria-current', 'time')
      expect(nowRow.textContent).toContain('DuringNow')
    })
  })

  describe('state override menu (#15)', () => {
    it('opens on the Time trigger with the manual state options', async () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00' })]
      renderMobile(<PlanTableMobile plan={makePlan({ rows })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: 'Override Wed 14:30 slot' }))

      expect(screen.getByRole('menu')).toBeInTheDocument()
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
      renderMobile(<PlanTableMobile plan={makePlan({ rows })} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: 'Override Wed 14:30 slot' }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Manual Charge' }))

      await waitFor(() => expect(body?.get('time')).toBe('Wed 14:30'))
      expect(body?.get('action')).toBe('Manual Charge')
    })

    it('reflects an active override from the overrides prop', () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00', slot_minute: 870 })]
      const overrides: PlanOverrides = { ...noOverrides, manual_charge_times: [870] }

      renderMobile(<PlanTableMobile plan={makePlan({ rows })} overrides={overrides} />)

      expect(screen.getByRole('button', { name: 'Override Wed 14:30 slot' })).toHaveTextContent('Manual Charge')
    })
  })
})
