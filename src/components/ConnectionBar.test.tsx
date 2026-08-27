import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ConnectionBar } from './ConnectionBar'
import { DEFAULT_BASE_URL } from '../api/connection'
import { server } from '../test/msw/server'
import { renderWithProviders } from '../test/renderWithProviders'

describe('ConnectionBar', () => {
  it('shows a CORS hint once the ping to the configured URL fails', async () => {
    server.use(http.get(`${DEFAULT_BASE_URL}/api/ping`, () => HttpResponse.error()))

    renderWithProviders(<ConnectionBar />)

    await waitFor(() => expect(screen.getByText(/web_cors_origins/)).toBeInTheDocument())
  })

  it('disables Connect until the URL field actually changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ConnectionBar />)

    const connectButton = screen.getByRole('button', { name: 'Connect' })
    expect(connectButton).toBeDisabled()

    await user.type(screen.getByLabelText('Predbat URL'), 'x')

    expect(connectButton).toBeEnabled()
  })
})
