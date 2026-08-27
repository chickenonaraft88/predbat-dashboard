import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DebugColumnsToggle } from './DebugColumnsToggle'

describe('DebugColumnsToggle', () => {
  it('reflects the enabled prop', () => {
    render(<DebugColumnsToggle enabled onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onChange with the new value when toggled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DebugColumnsToggle enabled={false} onChange={onChange} />)

    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
