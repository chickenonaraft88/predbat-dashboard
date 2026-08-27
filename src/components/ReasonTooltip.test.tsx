import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ReasonTooltip } from './ReasonTooltip'

describe('ReasonTooltip', () => {
  it('renders children unwrapped when there are no reasons', () => {
    render(<ReasonTooltip reasons={[]}>Idle</ReasonTooltip>)

    expect(screen.getByText('Idle')).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the tooltip on hover and hides it on mouse leave', async () => {
    const user = userEvent.setup()
    render(<ReasonTooltip reasons={['Charging up to 80%.']}>Chrg</ReasonTooltip>)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Charging up to 80%.')

    await user.unhover(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on keyboard focus, for keyboard/touch users', async () => {
    const user = userEvent.setup()
    render(<ReasonTooltip reasons={['Freeze charging.']}>FrzChrg</ReasonTooltip>)

    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Freeze charging.')
  })

  it('toggles the tap-to-reveal panel on tap (a touch tap dispatches a bare click, with no preceding hover)', () => {
    render(<ReasonTooltip reasons={['Exporting down to 4%.']}>Exp</ReasonTooltip>)

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders one line per reason', () => {
    render(
      <ReasonTooltip reasons={['First reason.', 'Second reason.']}>
        Chrg/Exp
      </ReasonTooltip>,
    )

    fireEvent.click(screen.getByRole('button'))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('First reason.')
    expect(tooltip).toHaveTextContent('Second reason.')
  })
})
