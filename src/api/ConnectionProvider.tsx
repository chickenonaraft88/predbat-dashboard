import { useMemo, useState, type ReactNode } from 'react'

import { ConnectionContext, loadStoredBaseUrl, storeBaseUrl } from './connection'

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(loadStoredBaseUrl)

  const value = useMemo(
    () => ({
      baseUrl,
      setBaseUrl: (next: string) => {
        storeBaseUrl(next)
        setBaseUrlState(next)
      },
    }),
    [baseUrl],
  )

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}
