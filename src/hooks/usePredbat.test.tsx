import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { usePlanData } from './usePredbat'
import { DEFAULT_BASE_URL } from '../api/connection'
import { makePlanRow, samplePlanData } from '../test/msw/handlers'
import { server } from '../test/msw/server'
import { TestProviders } from '../test/renderWithProviders'

/**
 * renderHook() from @testing-library/react does not reliably propagate a
 * query's post-refetch state back through `result.current` in this stack
 * (React 19 + RTL + TanStack Query v5) - rendering a small consumer
 * component and asserting on the DOM is the reliable alternative.
 */
function PlanDataProbe({ refetchRef }: { refetchRef: { current?: () => Promise<unknown> } }) {
  const result = usePlanData()
  useEffect(() => {
    refetchRef.current = () => result.refetch()
  })
  return (
    <div>
      <span data-testid="status">{result.status}</span>
      <span data-testid="soc">{result.data?.plan?.rows[0]?.soc_percent ?? ''}</span>
      <span data-testid="error">{result.error instanceof Error ? result.error.message : ''}</span>
    </div>
  )
}

function renderProbe() {
  const refetchRef: { current?: () => Promise<unknown> } = {}
  render(
    <TestProviders>
      <PlanDataProbe refetchRef={refetchRef} />
    </TestProviders>,
  )
  return refetchRef
}

describe('usePlanData', () => {
  it('returns the plan on first fetch', async () => {
    renderProbe()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'))
    expect(screen.getByTestId('soc')).toHaveTextContent('62')
  })

  it('keeps serving the previous plan when Predbat replies {unchanged: true}', async () => {
    let requestCount = 0
    server.use(
      http.get(`${DEFAULT_BASE_URL}/api/plan_data`, () => {
        requestCount += 1
        if (requestCount === 1) return HttpResponse.json(samplePlanData)
        return HttpResponse.json({ unchanged: true, overrides_hash: samplePlanData.overrides_hash })
      }),
    )

    const refetchRef = renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'))

    await refetchRef.current!()

    expect(screen.getByTestId('status')).toHaveTextContent('success')
    expect(screen.getByTestId('soc')).toHaveTextContent('62')
    expect(requestCount).toBe(2)
  })

  it('surfaces an error if Predbat replies {unchanged: true} before any plan has ever been fetched', async () => {
    server.use(http.get(`${DEFAULT_BASE_URL}/api/plan_data`, () => HttpResponse.json({ unchanged: true, overrides_hash: 'none-yet' })))

    renderProbe()

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(screen.getByTestId('error')).toHaveTextContent(/no plan data yet/i)
  })

  it('reflects updated plan rows on the next successful poll', async () => {
    let requestCount = 0
    server.use(
      http.get(`${DEFAULT_BASE_URL}/api/plan_data`, () => {
        requestCount += 1
        if (requestCount === 1) return HttpResponse.json(samplePlanData)
        return HttpResponse.json({
          ...samplePlanData,
          plan: { ...samplePlanData.plan!, rows: [makePlanRow({ soc_percent: 80 })], timestamp: '2026-08-26T12:05:00+01:00' },
          overrides_hash: 'hash-2',
        })
      }),
    )

    const refetchRef = renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'))

    await refetchRef.current!()

    await waitFor(() => expect(screen.getByTestId('soc')).toHaveTextContent('80'))
  })
})
