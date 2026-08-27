import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'

import { App } from './App'
import { DEFAULT_BASE_URL } from './api/connection'
import { samplePlanData } from './test/msw/handlers'
import { server } from './test/msw/server'
import { TestProviders } from './test/renderWithProviders'

describe('App', () => {
  it('renders the plan table and chart once Predbat returns a plan', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>,
    )

    expect(screen.getByText('Predbat Dashboard')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('columnheader', { name: 'State' })).toBeInTheDocument())
  })

  it('shows the empty-plan message when Predbat has no plan yet', async () => {
    server.use(http.get(`${DEFAULT_BASE_URL}/api/plan_data`, () => HttpResponse.json({ ...samplePlanData, plan: { ...samplePlanData.plan!, rows: [] } })))

    render(
      <TestProviders>
        <App />
      </TestProviders>,
    )

    expect(await screen.findByText(/has not published a plan yet/i)).toBeInTheDocument()
  })

  it('switches to the History view and shows actual-vs-planned columns', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders>
        <App />
      </TestProviders>,
    )

    await waitFor(() => expect(screen.getByRole('columnheader', { name: 'State' })).toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: 'History' }))

    expect(await screen.findByRole('columnheader', { name: 'Target SOC %' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Actual SOC %' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Cost' })).toBeInTheDocument()
  })

  it('switches to the Yesterday-without-Predbat view and shows the baseline rows', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders>
        <App />
      </TestProviders>,
    )

    await waitFor(() => expect(screen.getByRole('columnheader', { name: 'State' })).toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: 'Yesterday without Predbat' }))

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Yesterday without Predbat' })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('shows the plan view by default with the Plan tab selected', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>,
    )

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Yesterday without Predbat' })).toHaveAttribute('aria-selected', 'false')
  })
})
