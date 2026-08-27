import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { useDebugColumns } from './useDebugColumns'

function Consumer() {
  const [enabled, setEnabled] = useDebugColumns()
  return (
    <div>
      <p data-testid="value">{String(enabled)}</p>
      <button onClick={() => setEnabled(!enabled)}>toggle</button>
    </div>
  )
}

afterEach(() => {
  window.localStorage.clear()
})

describe('useDebugColumns', () => {
  it('defaults to false and persists true across a remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Consumer />)
    expect(screen.getByTestId('value')).toHaveTextContent('false')

    await user.click(screen.getByRole('button'))
    expect(screen.getByTestId('value')).toHaveTextContent('true')

    unmount()
    render(<Consumer />)
    expect(screen.getByTestId('value')).toHaveTextContent('true')
  })
})
