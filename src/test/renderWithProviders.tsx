import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { useState, type ReactElement, type ReactNode } from 'react'

import { ConnectionContext, DEFAULT_BASE_URL } from '../api/connection'

export function TestProviders({ children, baseUrl = DEFAULT_BASE_URL }: { children: ReactNode; baseUrl?: string }) {
  // Created once via useState's lazy initializer, not on every render - a new
  // QueryClient per render would orphan any in-flight query, since a refetch
  // started against the old client never reaches an observer that has since
  // been handed a different one. Retries are disabled so failing-request
  // tests don't wait out backoff delays.
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))

  return (
    <QueryClientProvider client={client}>
      <ConnectionContext.Provider value={{ baseUrl, setBaseUrl: () => {} }}>{children}</ConnectionContext.Provider>
    </QueryClientProvider>
  )
}

// oxlint-disable-next-line react/only-export-components -- test helper file, not part of any hot-reloaded UI
export function renderWithProviders(ui: ReactElement, options?: { baseUrl?: string }) {
  // Wraps via the `wrapper` option (not by hand-nesting <TestProviders> around
  // `ui` here) so the returned `rerender` re-applies the wrapper on every call -
  // a caller's `rerender(<Foo />)` would otherwise mount `<Foo />` at the root
  // with no providers at all, rather than replacing just the previous `ui`.
  return render(ui, { wrapper: ({ children }) => <TestProviders baseUrl={options?.baseUrl}>{children}</TestProviders> })
}
