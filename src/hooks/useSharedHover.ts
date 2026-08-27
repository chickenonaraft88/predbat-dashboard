import { useCallback, useState } from 'react'

/**
 * Shared hover state for a row time (matches `PlanRow.time`), so PlanTable
 * and PlanChart can highlight the same slot regardless of which one the
 * pointer is actually over.
 */
export function useSharedHover() {
  const [hoveredTime, setHoveredTime] = useState<string | null>(null)
  const clearHover = useCallback(() => setHoveredTime(null), [])
  return { hoveredTime, setHoveredTime, clearHover }
}
