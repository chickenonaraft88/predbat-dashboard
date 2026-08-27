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
})
