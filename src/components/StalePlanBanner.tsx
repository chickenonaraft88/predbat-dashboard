import { isPlanStale } from '../lib/planTime'

/** A warning banner shown once the plan's published timestamp is more than 15 minutes old. */
export function StalePlanBanner({ timestamp, now }: { timestamp: string; now: Date }) {
  if (!isPlanStale(timestamp, now)) {
    return null
  }

  return (
    <div
      role="status"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
    >
      This plan was last published at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and may be stale - Predbat has not
      updated it in over 15 minutes.
    </div>
  )
}
