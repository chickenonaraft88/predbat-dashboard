import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

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
})
