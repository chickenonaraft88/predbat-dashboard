/** A recharts data point carrying both its x-axis category label and the row time it represents. */
export interface ChartHoverPoint {
  time: string
  rawTime: string
}

/**
 * Maps a recharts `activeLabel` (the x-axis category value under the pointer)
 * back to the plan row time it represents, for syncing chart hover with the
 * table. Returns null when nothing matches (or there is no active label).
 */
export function resolveHoveredRowTime(points: ChartHoverPoint[], activeLabel: string | number | undefined): string | null {
  if (activeLabel === undefined) return null
  const match = points.find((point) => point.time === String(activeLabel))
  return match ? match.rawTime : null
}
