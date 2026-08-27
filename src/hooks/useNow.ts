import { useEffect, useState } from 'react'

const DEFAULT_INTERVAL_MS = 30_000

/** The current time, re-rendering every `intervalMs` (default 30s). */
export function useNow(intervalMs = DEFAULT_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
