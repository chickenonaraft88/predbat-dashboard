import { OverrideMenu } from './OverrideMenu'
import { usePlanOverride } from '../hooks/usePredbat'
import { formatOverrideTime } from '../lib/time'
import type { PlanOverrideAction, PlanOverrides, PlanRow } from '../api/types'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const PLAN_OVERRIDE_ITEMS: Array<{ label: string; action: PlanOverrideAction }> = [
  { label: 'Manual Demand', action: 'Manual Demand' },
  { label: 'Manual Charge', action: 'Manual Charge' },
  { label: 'Manual Export', action: 'Manual Export' },
  { label: 'Manual Freeze Charge', action: 'Manual Freeze Charge' },
  { label: 'Manual Freeze Export', action: 'Manual Freeze Export' },
  { label: 'Clear', action: 'Clear' },
]

/** The manual state override label active on a slot, if any - from `PlanOverrides`' `manual_*_times` arrays of `slot_minute`. */
function activePlanOverride(slotMinute: number, overrides: PlanOverrides | undefined): string | null {
  if (!overrides) return null
  if (overrides.manual_charge_times.includes(slotMinute)) return 'Manual Charge'
  if (overrides.manual_export_times.includes(slotMinute)) return 'Manual Export'
  if (overrides.manual_freeze_charge_times.includes(slotMinute)) return 'Manual Freeze Charge'
  if (overrides.manual_freeze_export_times.includes(slotMinute)) return 'Manual Freeze Export'
  if (overrides.manual_demand_times.includes(slotMinute)) return 'Manual Demand'
  return null
}

function TimeCell({ row, overrides }: { row: PlanRow; overrides: PlanOverrides | undefined }) {
  const planOverride = usePlanOverride()
  const active = activePlanOverride(row.slot_minute, overrides)
  // formatOverrideTime (not the locale-formatted display text) so this label stays stable
  // regardless of the viewer's locale/timezone.
  const menuLabel = `Override ${formatOverrideTime(row.time)} slot`

  return (
    <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">
      <OverrideMenu
        menuLabel={menuLabel}
        active={active !== null}
        trigger={
          <>
            {formatTime(row.time)}
            {active && <span className="ml-1 text-[0.65rem] font-sans text-amber-700 dark:text-amber-400">({active})</span>}
          </>
        }
        items={PLAN_OVERRIDE_ITEMS.map(({ label, action }) => ({
          label,
          onSelect: () => planOverride.mutate({ time: formatOverrideTime(row.time), action }),
        }))}
      />
    </td>
  )
}

export function PlanTable({ rows, overrides }: { rows: PlanRow[]; overrides?: PlanOverrides }) {
  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2 text-right">Import p/kWh</th>
            <th className="px-3 py-2 text-right">Export p/kWh</th>
            <th className="px-3 py-2 text-right">SOC %</th>
            <th className="px-3 py-2 text-right">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.time} className="bg-white odd:bg-slate-50 dark:bg-slate-900 dark:odd:bg-slate-950/40">
              <TimeCell row={row} overrides={overrides} />
              <td className="px-3 py-1.5" style={{ color: row.state_color || undefined }}>
                {row.state_text}
              </td>
              <td className="px-3 py-1.5 text-right">{row.import_rate.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.export_rate.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.soc_percent.toFixed(0)}</td>
              <td className="px-3 py-1.5 text-right">{row.total_cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
