import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMediaQuery } from './useMediaQuery'

function Consumer({ query }: { query: string }) {
  const matches = useMediaQuery(query)
  return <p data-testid="value">{String(matches)}</p>
}

function fakeMediaQueryList(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<() => void>()
  return {
    get matches() {
      return matches
    },
    media: '',
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    set(value: boolean) {
      matches = value
      listeners.forEach((listener) => listener())
    },
  } as unknown as MediaQueryList & { set: (value: boolean) => void }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMediaQuery', () => {
  it('reflects the initial match state', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(fakeMediaQueryList(true))

    render(<Consumer query="(max-width: 767px)" />)

    expect(screen.getByTestId('value')).toHaveTextContent('true')
  })

  it('updates live when the query match changes', () => {
    const mql = fakeMediaQueryList(false)
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql)

    render(<Consumer query="(max-width: 767px)" />)
    expect(screen.getByTestId('value')).toHaveTextContent('false')

    act(() => mql.set(true))
    expect(screen.getByTestId('value')).toHaveTextContent('true')
  })

  it('defaults to false when matchMedia is unavailable', () => {
    const original = window.matchMedia
    // @ts-expect-error - simulating an environment without matchMedia
    delete window.matchMedia

    render(<Consumer query="(max-width: 767px)" />)
    expect(screen.getByTestId('value')).toHaveTextContent('false')

    window.matchMedia = original
  })
})
