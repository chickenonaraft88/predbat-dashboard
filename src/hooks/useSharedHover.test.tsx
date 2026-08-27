import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useSharedHover } from './useSharedHover'

function Consumer() {
  const { hoveredTime, setHoveredTime, clearHover } = useSharedHover()
  return (
    <div>
      <p data-testid="value">{hoveredTime ?? 'none'}</p>
      <button onClick={() => setHoveredTime('2026-08-26T12:30:00+01:00')}>hover</button>
      <button onClick={clearHover}>clear</button>
    </div>
  )
}

describe('useSharedHover', () => {
  it('starts with no hovered time', () => {
    render(<Consumer />)
    expect(screen.getByTestId('value')).toHaveTextContent('none')
  })

  it('updates and clears the shared hover value', async () => {
    const user = userEvent.setup()
    render(<Consumer />)

    await user.click(screen.getByRole('button', { name: 'hover' }))
    expect(screen.getByTestId('value')).toHaveTextContent('2026-08-26T12:30:00+01:00')

    await user.click(screen.getByRole('button', { name: 'clear' }))
    expect(screen.getByTestId('value')).toHaveTextContent('none')
  })
})
