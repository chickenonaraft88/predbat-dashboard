import type { PlanRow } from '../api/types'

const DEFAULT_SLOT_MINUTES = 30

/**
 * Index of the row whose `[time, time + slot)` range contains `now`, or -1 if
 * `now` falls outside the plan entirely (before the first row, or after the
 * last row's slot). A row's slot length is inferred from the gap to the next
 * row, falling back to Predbat's default 30-minute `plan_interval_minutes`
 * for the last row.
 */
export function findCurrentRowIndex(rows: PlanRow[], now: Date): number {
  const nowMs = now.getTime()
  for (let i = 0; i < rows.length; i++) {
    const start = new Date(rows[i].time).getTime()
    const nextStart = i + 1 < rows.length ? new Date(rows[i + 1].time).getTime() : start + DEFAULT_SLOT_MINUTES * 60 * 1000
    if (nowMs >= start && nowMs < nextStart) return i
  }
  return -1
}

/** True once `now` is more than `staleAfterMinutes` past the plan's published timestamp. */
export function isPlanStale(timestamp: string, now: Date, staleAfterMinutes = 15): boolean {
  const ageMs = now.getTime() - new Date(timestamp).getTime()
  return ageMs > staleAfterMinutes * 60 * 1000
}

/**
 * The `time` of the row PlanChart's "now" reference line should snap to
 * (recharts' categorical x-axis needs a matching category label, not an
 * arbitrary timestamp) - the latest row whose slot has already started, or
 * undefined when `now` is before the plan begins.
 */
export function findNowRowTime(rows: PlanRow[], now: Date): string | undefined {
  const index = findCurrentRowIndex(rows, now)
  if (index >= 0) return rows[index].time
  // findCurrentRowIndex returns -1 both before the plan starts and after it
  // ends - distinguish "after" by checking against the last row directly.
  if (rows.length > 0 && now.getTime() >= new Date(rows[rows.length - 1].time).getTime()) {
    return rows[rows.length - 1].time
  }
  return undefined
}
