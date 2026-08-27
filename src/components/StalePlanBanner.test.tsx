import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StalePlanBanner } from './StalePlanBanner'
import { useNow } from '../hooks/useNow'

describe('StalePlanBanner', () => {
  it('renders nothing when the plan is fresh', () => {
    render(<StalePlanBanner timestamp="2026-08-26T12:00:00+01:00" now={new Date('2026-08-26T12:10:00+01:00')} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders a warning once the plan is more than 15 minutes old', () => {
    render(<StalePlanBanner timestamp="2026-08-26T12:00:00+01:00" now={new Date('2026-08-26T12:20:00+01:00')} />)

    expect(screen.getByRole('status')).toHaveTextContent(/stale/i)
  })
})

function LiveBanner({ timestamp }: { timestamp: string }) {
  const now = useNow()
  return <StalePlanBanner timestamp={timestamp} now={now} />
}

describe('StalePlanBanner (age tracked over time)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T12:00:00+01:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('appears once the plan ages past 15 minutes, with no prop change needed', () => {
    render(<LiveBanner timestamp="2026-08-26T12:00:00+01:00" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(16 * 60 * 1000)
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('stays hidden while the plan is still within the freshness window', () => {
    render(<LiveBanner timestamp="2026-08-26T12:00:00+01:00" />)

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
