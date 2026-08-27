import { useEffect, useState } from 'react'

import { loadDebugColumnsPref, storeDebugColumnsPref } from '../lib/debugColumns'

/** Persisted (per-viewer, via localStorage) on/off state for the plan table's debug columns. */
export function useDebugColumns(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(() => loadDebugColumnsPref())

  useEffect(() => {
    storeDebugColumnsPref(enabled)
  }, [enabled])

  return [enabled, setEnabled]
}
