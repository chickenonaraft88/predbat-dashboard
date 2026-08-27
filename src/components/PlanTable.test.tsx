import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { PlanTable } from './PlanTable'
import { DEFAULT_BASE_URL } from '../api/connection'
import type { PlanOverrides } from '../api/types'
import { makePlanRow } from '../test/msw/handlers'
import { renderWithProviders } from '../test/renderWithProviders'
import { server } from '../test/msw/server'

function render(ui: React.ReactElement) {
  return renderWithProviders(ui)
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

    render(<PlanTable rows={rows} />)

    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('24.57')).toBeInTheDocument()
    expect(screen.getByText('61')).toBeInTheDocument()
  })

  it('renders no data rows for an empty plan', () => {
    render(<PlanTable rows={[]} />)

    expect(screen.queryAllByRole('row')).toHaveLength(1) // header row only
  })

  describe('plan override menu (#15)', () => {
    it('opens on the Time cell with the manual state options', async () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00' })]
      render(<PlanTable rows={rows} overrides={noOverrides} />)

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
      render(<PlanTable rows={rows} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: 'Override Wed 14:30 slot' }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Manual Charge' }))

      await waitFor(() => expect(body?.get('time')).toBe('Wed 14:30'))
      expect(body?.get('action')).toBe('Manual Charge')
    })

    it('reflects an active override from the overrides prop', () => {
      const rows = [makePlanRow({ time: '2026-08-26T14:30:00+01:00', slot_minute: 870 })]
      const overrides: PlanOverrides = { ...noOverrides, manual_charge_times: [870] }

      render(<PlanTable rows={rows} overrides={overrides} />)

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
      render(<PlanTable rows={[row()]} overrides={noOverrides} />)

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
      render(<PlanTable rows={[row()]} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override export rate/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Set Export Rate' }))
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Set Export Rate value' }), '5')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(getBody()?.get('action')).toBe('Set Export'))
      expect(getBody()?.get('rate')).toBe('5')
    })

    it('posts the right payload from the SOC cell', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable rows={[row()]} overrides={noOverrides} />)

      await userEvent.click(screen.getByRole('button', { name: /Override SOC/ }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'Set SOC' }))
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Set SOC value' }), '80')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(getBody()?.get('action')).toBe('Set SOC'))
      expect(getBody()?.get('rate')).toBe('80')
    })

    it('posts the right payload from the load cell, including a Clear', async () => {
      const getBody = await captureRateOverrideBody()
      render(<PlanTable rows={[row()]} overrides={noOverrides} />)

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

      render(<PlanTable rows={[row()]} overrides={overrides} />)

      expect(screen.getByRole('button', { name: /Override import rate/ })).toHaveTextContent('45.00')
      expect(screen.getByRole('button', { name: /Override export rate/ })).toHaveTextContent('8.00')
      expect(screen.getByRole('button', { name: /Override SOC/ })).toHaveTextContent('90')
      expect(screen.getByRole('button', { name: /Override load/ })).toHaveTextContent('1.50')
    })
  })
})
