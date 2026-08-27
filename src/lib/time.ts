const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Formats a `PlanRow.time` ISO timestamp (e.g. "2026-08-26T14:30:00+01:00")
 * as the `time` parameter Predbat's `/plan_override` and `/rate_override`
 * endpoints expect ("Mon 14:30", i.e. `%a %H:%M`).
 *
 * The weekday and hour/minute are read straight from the string's own
 * digits, not reinterpreted through the browser's local timezone - the
 * offset in the ISO string already encodes Predbat's configured timezone,
 * and a calendar date's weekday does not change when re-expressed in UTC,
 * so anchoring the parse to UTC keeps the result independent of where the
 * dashboard happens to be viewed from.
 */
export function formatOverrideTime(isoTime: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoTime)
  if (!match) {
    throw new Error(`Cannot parse plan row time as an ISO timestamp: ${isoTime}`)
  }
  const [, year, month, day, hour, minute] = match
  const weekdayIndex = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()
  return `${WEEKDAYS[weekdayIndex]} ${hour}:${minute}`
}
