import { useEffect, useRef } from 'react'

import type { CSSProperties } from 'react'

import type { PlanOverrides, PlanRow, RateOverrideAction, RawPlan } from '../api/types'
import { useIsDarkMode } from '../hooks/useIsDarkMode'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useNow } from '../hooks/useNow'
import { usePlanOverride, useRateOverride } from '../hooks/usePredbat'
import { cellBackground, textColorForBg } from '../lib/planColors'
import { activePlanOverride, findOverrideValue, PLAN_OVERRIDE_ITEMS } from '../lib/planOverrides'
import { findCurrentRowIndex } from '../lib/planTime'
import { resolveReasons } from '../lib/reasons'
import { formatOverrideTime } from '../lib/time'
import { OverrideMenu } from './OverrideMenu'
import { PlanTableMobile } from './PlanTableMobile'
import { RateOverrideMenu } from './RateOverrideMenu'
import { ReasonTooltip } from './ReasonTooltip'

/** Below this viewport width, `PlanTable` renders `PlanTableMobile`'s card list instead of the desktop table - matches the `md` breakpoint used elsewhere for layout switches. */
const MOBILE_QUERY = '(max-width: 767px)'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sumRows(rows: PlanRow[], key: keyof PlanRow): number {
  return rows.reduce((total, row) => {
    const value = row[key]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
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

function ValueOverrideCell({
  time,
  displayValue,
  overrideValue,
  setAction,
  clearAction,
  setLabel,
  clearLabel,
  menuLabel,
  formatValue,
  inputStep,
  style,
}: {
  time: string
  displayValue: number
  overrideValue: number | null
  setAction: RateOverrideAction
  clearAction: RateOverrideAction
  setLabel: string
  clearLabel: string
  menuLabel: string
  formatValue: (value: number) => string
  inputStep?: string
  style?: CSSProperties
}) {
  const rateOverride = useRateOverride()
  const active = overrideValue !== null

  return (
    <td className="px-3 py-1.5 text-right" style={style}>
      <RateOverrideMenu
        trigger={formatValue(active ? overrideValue : displayValue)}
        menuLabel={menuLabel}
        setLabel={setLabel}
        clearLabel={clearLabel}
        active={active}
        inputStep={inputStep}
        onSet={(rate) => rateOverride.mutate({ time: formatOverrideTime(time), action: setAction, rate })}
        onClear={() => rateOverride.mutate({ time: formatOverrideTime(time), action: clearAction, rate: '0' })}
      />
    </td>
  )
}

/** Props shared by `PlanTable` and its two layout implementations (`DesktopPlanTable`/`PlanTableMobile`). */
export interface PlanTableProps {
  plan: RawPlan
  overrides?: PlanOverrides
  /** The row time (matches PlanRow.time) the chart currently has hovered, or null/undefined for none. */
  hoveredTime?: string | null
  /** Called with a row's time on row hover, and null on mouse-leave - lets the chart mirror it. */
  onHoverRow?: (time: string | null) => void
  /** Shows effective (loss-adjusted) rate, PV10/Load10 forecast brackets, clipped kWh and XLoad kWh columns. */
  debugColumns?: boolean
}

/**
 * The plan table, as a data grid - used at `md` and wider. Below that,
 * `PlanTable` renders `PlanTableMobile`'s card list instead: a multi-column
 * table doesn't survive a phone screen, however much it scrolls.
 */
function DesktopPlanTable({ plan, overrides, hoveredTime, onHoverRow, debugColumns = false }: PlanTableProps) {
  const { rows } = plan
  const showCar = plan.num_cars > 0
  const showIboost = plan.iboost_enable
  const showCarbon = plan.carbon_enable
  const isDark = useIsDarkMode()

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
                <TimeCell row={row} overrides={overrides} />
                <td className="p-0 font-medium" data-testid="state-cell">
                  <ReasonTooltip reasons={reasonTexts}>
                    {row.state2_text ? (
                      <div className="flex h-full w-full" data-testid="state-split">
                        <span
                          className="flex-1 px-3 py-1.5"
                          data-testid="state-half-1"
                          style={{ backgroundColor: cellBackground(row.state_color, isDark), color: textColorForBg(cellBackground(row.state_color, isDark)) }}
                        >
                          {row.state_text}
                        </span>
                        <span
                          className="flex-1 px-3 py-1.5"
                          data-testid="state-half-2"
                          style={{ backgroundColor: cellBackground(row.state2_color, isDark), color: textColorForBg(cellBackground(row.state2_color, isDark)) }}
                        >
                          {row.state2_text}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="px-3 py-1.5"
                        data-testid="state-single"
                        style={{ backgroundColor: cellBackground(row.state_color, isDark), color: textColorForBg(cellBackground(row.state_color, isDark)) }}
                      >
                        {row.state_text}
                      </div>
                    )}
                  </ReasonTooltip>
                </td>
                <ValueOverrideCell
                  time={row.time}
                  displayValue={row.import_rate}
                  overrideValue={findOverrideValue(overrides?.manual_import_rates, row.slot_minute, (e) => e.rate)}
                  setAction="Set Import"
                  clearAction="Clear Import"
                  setLabel="Set Import Rate"
                  clearLabel="Clear Import Rate"
                  menuLabel={`Override import rate at ${formatOverrideTime(row.time)}`}
                  formatValue={(v) => v.toFixed(2)}
                  style={{ backgroundColor: cellBackground(row.rate_color_import, isDark), color: textColorForBg(cellBackground(row.rate_color_import, isDark)) }}
                />
                {debugColumns && <td className="px-3 py-1.5 text-right">{row.import_rate_adjusted.toFixed(2)}</td>}
                <ValueOverrideCell
                  time={row.time}
                  displayValue={row.export_rate}
                  overrideValue={findOverrideValue(overrides?.manual_export_rates, row.slot_minute, (e) => e.rate)}
                  setAction="Set Export"
                  clearAction="Clear Export"
                  setLabel="Set Export Rate"
                  clearLabel="Clear Export Rate"
                  menuLabel={`Override export rate at ${formatOverrideTime(row.time)}`}
                  formatValue={(v) => v.toFixed(2)}
                  style={{ backgroundColor: cellBackground(row.rate_color_export, isDark), color: textColorForBg(cellBackground(row.rate_color_export, isDark)) }}
                />
                {debugColumns && <td className="px-3 py-1.5 text-right">{row.export_rate_adjusted.toFixed(2)}</td>}
                <td className="px-3 py-1.5 text-right">{row.pv_forecast.toFixed(2)}</td>
                {debugColumns && <td className="px-3 py-1.5 text-right">{(row.pv_forecast10 ?? 0).toFixed(2)}</td>}
                <ValueOverrideCell
                  time={row.time}
                  displayValue={row.load_forecast}
                  overrideValue={findOverrideValue(overrides?.manual_load_adjust, row.slot_minute, (e) => e.adjustment)}
                  setAction="Set Load"
                  clearAction="Clear Load"
                  setLabel="Set Load"
                  clearLabel="Clear Load"
                  menuLabel={`Override load at ${formatOverrideTime(row.time)}`}
                  formatValue={(v) => v.toFixed(2)}
                />
                {debugColumns && <td className="px-3 py-1.5 text-right">{(row.load_forecast10 ?? 0).toFixed(2)}</td>}
                {debugColumns && <td className="px-3 py-1.5 text-right">{row.clipped.toFixed(2)}</td>}
                {debugColumns && <td className="px-3 py-1.5 text-right">{(row.extra_load ?? 0).toFixed(2)}</td>}
                {showCar && <td className="px-3 py-1.5 text-right">{(row.car_charging ?? 0).toFixed(2)}</td>}
                {showIboost && <td className="px-3 py-1.5 text-right">{(row.iboost ?? 0).toFixed(2)}</td>}
                {showCarbon && <td className="px-3 py-1.5 text-right">{(row.carbon_intensity ?? 0).toFixed(0)}</td>}
                {showCarbon && <td className="px-3 py-1.5 text-right">{(row.total_carbon ?? 0).toFixed(2)}</td>}
                <ValueOverrideCell
                  time={row.time}
                  displayValue={row.soc_percent}
                  overrideValue={findOverrideValue(overrides?.manual_soc, row.slot_minute, (e) => e.target)}
                  setAction="Set SOC"
                  clearAction="Clear SOC"
                  setLabel="Set SOC"
                  clearLabel="Clear SOC"
                  menuLabel={`Override SOC at ${formatOverrideTime(row.time)}`}
                  formatValue={(v) => v.toFixed(0)}
                  inputStep="1"
                />
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

/**
 * Picks between the desktop table and the mobile card list based on viewport
 * width. This has to be a separate component from both, rather than an
 * `if (isMobile) return ...` early return inside one of them - the two
 * layouts call a different number of hooks internally, and switching which
 * one is mounted is fine, but switching how many hooks *one* component calls
 * between renders is not.
 */
export function PlanTable(props: PlanTableProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  return isMobile ? <PlanTableMobile {...props} /> : <DesktopPlanTable {...props} />
}
