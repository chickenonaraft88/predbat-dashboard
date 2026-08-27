import { useEffect, useRef } from 'react'

import type { PlanRow, RawPlan } from '../api/types'
import { useNow } from '../hooks/useNow'
import { textColorForBg } from '../lib/planColors'
import { findCurrentRowIndex } from '../lib/planTime'
import { resolveReasons } from '../lib/reasons'
import { ReasonTooltip } from './ReasonTooltip'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sumRows(rows: PlanRow[], key: keyof PlanRow): number {
  return rows.reduce((total, row) => {
    const value = row[key]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

export function PlanTable({
  plan,
  hoveredTime,
  onHoverRow,
  debugColumns = false,
}: {
  plan: RawPlan
  /** The row time (matches PlanRow.time) the chart currently has hovered, or null/undefined for none. */
  hoveredTime?: string | null
  /** Called with a row's time on row hover, and null on mouse-leave - lets the chart mirror it. */
  onHoverRow?: (time: string | null) => void
  /** Shows effective (loss-adjusted) rate, PV10/Load10 forecast brackets, clipped kWh and XLoad kWh columns. */
  debugColumns?: boolean
}) {
  const { rows } = plan
  const showCar = plan.num_cars > 0
  const showIboost = plan.iboost_enable
  const showCarbon = plan.carbon_enable

  const now = useNow()
  const currentRowIndex = findCurrentRowIndex(rows, now)
  const currentRowRef = useRef<HTMLTableRowElement | null>(null)
  const hasAutoScrolled = useRef(false)

  useEffect(() => {
    if (!hasAutoScrolled.current && currentRowIndex >= 0 && currentRowRef.current) {
      currentRowRef.current.scrollIntoView?.({ block: 'center' })
      hasAutoScrolled.current = true
    }
  }, [currentRowIndex])

  // The API sends a precomputed `totals` object; fall back to summing rows for
  // fixtures/older Predbat releases that don't yet publish it.
  const totals = plan.totals ?? {
    total_cost: sumRows(rows, 'cost_change'),
    pv_forecast: sumRows(rows, 'pv_forecast'),
    load_forecast: sumRows(rows, 'load_forecast'),
    clipped: sumRows(rows, 'clipped'),
    soc_percent: rows.length > 0 ? rows[rows.length - 1].soc_percent : 0,
    car_charging: showCar ? sumRows(rows, 'car_charging') : undefined,
    iboost: showIboost ? sumRows(rows, 'iboost') : undefined,
    total_carbon: showCarbon ? sumRows(rows, 'total_carbon') : undefined,
    extra_load: debugColumns ? sumRows(rows, 'extra_load') : undefined,
  }
  const leadingColSpan = debugColumns ? 6 : 4

  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2 text-right">Import p/kWh</th>
            {debugColumns && <th className="px-3 py-2 text-right">Import eff</th>}
            <th className="px-3 py-2 text-right">Export p/kWh</th>
            {debugColumns && <th className="px-3 py-2 text-right">Export eff</th>}
            <th className="px-3 py-2 text-right">PV kWh</th>
            {debugColumns && <th className="px-3 py-2 text-right">PV10 kWh</th>}
            <th className="px-3 py-2 text-right">Load kWh</th>
            {debugColumns && <th className="px-3 py-2 text-right">Load10 kWh</th>}
            {debugColumns && <th className="px-3 py-2 text-right">Clip kWh</th>}
            {debugColumns && <th className="px-3 py-2 text-right">XLoad kWh</th>}
            {showCar && <th className="px-3 py-2 text-right">Car kWh</th>}
            {showIboost && <th className="px-3 py-2 text-right">iBoost kWh</th>}
            {showCarbon && <th className="px-3 py-2 text-right">CO2 g/kWh</th>}
            {showCarbon && <th className="px-3 py-2 text-right">CO2 kg</th>}
            <th className="px-3 py-2 text-right">SOC %</th>
            <th className="px-3 py-2 text-right">Cost</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => {
            const reasonTexts = resolveReasons(row.reasons, plan.reason_templates)
            const isNow = index === currentRowIndex
            const isHovered = hoveredTime != null && row.time === hoveredTime
            const rowClasses = [isNow ? 'bg-sky-100 outline outline-2 -outline-offset-2 outline-sky-500 dark:bg-sky-950/50 dark:outline-sky-400' : 'bg-white odd:bg-slate-50 dark:bg-slate-900 dark:odd:bg-slate-950/40']
            if (isHovered) rowClasses.push('ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500')
            return (
            <tr
              key={row.time}
              ref={isNow ? currentRowRef : undefined}
              data-testid={isNow ? 'now-row' : isHovered ? 'hovered-row' : undefined}
              aria-current={isNow ? 'time' : undefined}
              className={rowClasses.join(' ')}
              onMouseEnter={() => onHoverRow?.(row.time)}
              onMouseLeave={() => onHoverRow?.(null)}
            >
              <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{formatTime(row.time)}</td>
              <td className="p-0 font-medium" data-testid="state-cell">
                <ReasonTooltip reasons={reasonTexts}>
                {row.state2_text ? (
                  <div className="flex h-full w-full" data-testid="state-split">
                    <span
                      className="flex-1 px-3 py-1.5"
                      data-testid="state-half-1"
                      style={{ backgroundColor: row.state_color || undefined, color: textColorForBg(row.state_color) }}
                    >
                      {row.state_text}
                    </span>
                    <span
                      className="flex-1 px-3 py-1.5"
                      data-testid="state-half-2"
                      style={{ backgroundColor: row.state2_color || undefined, color: textColorForBg(row.state2_color) }}
                    >
                      {row.state2_text}
                    </span>
                  </div>
                ) : (
                  <div
                    className="px-3 py-1.5"
                    data-testid="state-single"
                    style={{ backgroundColor: row.state_color || undefined, color: textColorForBg(row.state_color) }}
                  >
                    {row.state_text}
                  </div>
                )}
                </ReasonTooltip>
              </td>
              <td className="px-3 py-1.5 text-right" style={{ backgroundColor: row.rate_color_import || undefined, color: textColorForBg(row.rate_color_import) }}>
                {row.import_rate.toFixed(2)}
              </td>
              {debugColumns && <td className="px-3 py-1.5 text-right">{row.import_rate_adjusted.toFixed(2)}</td>}
              <td className="px-3 py-1.5 text-right" style={{ backgroundColor: row.rate_color_export || undefined, color: textColorForBg(row.rate_color_export) }}>
                {row.export_rate.toFixed(2)}
              </td>
              {debugColumns && <td className="px-3 py-1.5 text-right">{row.export_rate_adjusted.toFixed(2)}</td>}
              <td className="px-3 py-1.5 text-right">{row.pv_forecast.toFixed(2)}</td>
              {debugColumns && <td className="px-3 py-1.5 text-right">{(row.pv_forecast10 ?? 0).toFixed(2)}</td>}
              <td className="px-3 py-1.5 text-right">{row.load_forecast.toFixed(2)}</td>
              {debugColumns && <td className="px-3 py-1.5 text-right">{(row.load_forecast10 ?? 0).toFixed(2)}</td>}
              {debugColumns && <td className="px-3 py-1.5 text-right">{row.clipped.toFixed(2)}</td>}
              {debugColumns && <td className="px-3 py-1.5 text-right">{(row.extra_load ?? 0).toFixed(2)}</td>}
              {showCar && <td className="px-3 py-1.5 text-right">{(row.car_charging ?? 0).toFixed(2)}</td>}
              {showIboost && <td className="px-3 py-1.5 text-right">{(row.iboost ?? 0).toFixed(2)}</td>}
              {showCarbon && <td className="px-3 py-1.5 text-right">{(row.carbon_intensity ?? 0).toFixed(0)}</td>}
              {showCarbon && <td className="px-3 py-1.5 text-right">{(row.total_carbon ?? 0).toFixed(2)}</td>}
              <td className="px-3 py-1.5 text-right">{row.soc_percent.toFixed(0)}</td>
              <td className="px-3 py-1.5 text-right">{row.cost_change.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.total_cost.toFixed(2)}</td>
            </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-900">
            <td className="px-3 py-1.5" colSpan={leadingColSpan}>
              Totals
            </td>
            <td className="px-3 py-1.5 text-right">{totals.pv_forecast.toFixed(2)}</td>
            {debugColumns && <td className="px-3 py-1.5 text-right"></td>}
            <td className="px-3 py-1.5 text-right">{totals.load_forecast.toFixed(2)}</td>
            {debugColumns && <td className="px-3 py-1.5 text-right"></td>}
            {debugColumns && <td className="px-3 py-1.5 text-right">{totals.clipped.toFixed(2)}</td>}
            {debugColumns && <td className="px-3 py-1.5 text-right">{(totals.extra_load ?? 0).toFixed(2)}</td>}
            {showCar && <td className="px-3 py-1.5 text-right">{(totals.car_charging ?? 0).toFixed(2)}</td>}
            {showIboost && <td className="px-3 py-1.5 text-right">{(totals.iboost ?? 0).toFixed(2)}</td>}
            {showCarbon && <td className="px-3 py-1.5 text-right">{(totals.carbon_intensity ?? 0).toFixed(0)}</td>}
            {showCarbon && <td className="px-3 py-1.5 text-right">{(totals.total_carbon ?? 0).toFixed(2)}</td>}
            <td className="px-3 py-1.5 text-right">{totals.soc_percent.toFixed(0)}</td>
            <td className="px-3 py-1.5 text-right"></td>
            <td className="px-3 py-1.5 text-right">{totals.total_cost.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
