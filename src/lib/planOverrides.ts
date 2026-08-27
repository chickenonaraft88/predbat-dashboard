import type { PlanOverrideAction, PlanOverrides } from '../api/types'

/** The manual state override menu's items, in Predbat's plan_override action order. Shared by `PlanTable` (desktop) and `PlanTableMobile`. */
export const PLAN_OVERRIDE_ITEMS: Array<{ label: string; action: PlanOverrideAction }> = [
  { label: 'Manual Demand', action: 'Manual Demand' },
  { label: 'Manual Charge', action: 'Manual Charge' },
  { label: 'Manual Export', action: 'Manual Export' },
  { label: 'Manual Freeze Charge', action: 'Manual Freeze Charge' },
  { label: 'Manual Freeze Export', action: 'Manual Freeze Export' },
  { label: 'Clear', action: 'Clear' },
]

/** The manual state override label active on a slot, if any - from `PlanOverrides`' `manual_*_times` arrays of `slot_minute`. */
export function activePlanOverride(slotMinute: number, overrides: PlanOverrides | undefined): string | null {
  if (!overrides) return null
  if (overrides.manual_charge_times.includes(slotMinute)) return 'Manual Charge'
  if (overrides.manual_export_times.includes(slotMinute)) return 'Manual Export'
  if (overrides.manual_freeze_charge_times.includes(slotMinute)) return 'Manual Freeze Charge'
  if (overrides.manual_freeze_export_times.includes(slotMinute)) return 'Manual Freeze Export'
  if (overrides.manual_demand_times.includes(slotMinute)) return 'Manual Demand'
  return null
}

/** Looks up the override value for a slot from one of `PlanOverrides`' `manual_*` value arrays, if any. */
export function findOverrideValue<T extends { minutes: number }>(entries: T[] | undefined, slotMinute: number, pick: (entry: T) => number): number | null {
  const entry = entries?.find((e) => e.minutes === slotMinute)
  return entry === undefined ? null : pick(entry)
}
