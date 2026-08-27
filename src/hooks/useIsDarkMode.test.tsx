import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useIsDarkMode } from './useIsDarkMode'

function Consumer() {
  const isDark = useIsDarkMode()
  return <p data-testid="value">{String(isDark)}</p>
}

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('useIsDarkMode', () => {
  it('reflects the dark class already present at mount', () => {
    document.documentElement.classList.add('dark')

    render(<Consumer />)

    expect(screen.getByTestId('value')).toHaveTextContent('true')
  })

  it('defaults to false when the dark class is absent', () => {
    render(<Consumer />)

    expect(screen.getByTestId('value')).toHaveTextContent('false')
  })

  it('updates live when the dark class is toggled after mount', async () => {
    render(<Consumer />)
    expect(screen.getByTestId('value')).toHaveTextContent('false')

    // MutationObserver callbacks fire as a microtask, not synchronously, so
    // wait for the update rather than asserting immediately after mutating.
    document.documentElement.classList.add('dark')
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('true'))

    document.documentElement.classList.remove('dark')
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('false'))
  })
})
