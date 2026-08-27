import { useEffect, useRef, useState } from 'react'

import type { PlanOverrides, PlanRow, RateOverrideAction } from '../api/types'
import { useIsDarkMode } from '../hooks/useIsDarkMode'
import { useNow } from '../hooks/useNow'
import { usePlanOverride, useRateOverride } from '../hooks/usePredbat'
import { cellBackground, textColorForBg } from '../lib/planColors'
import { activePlanOverride, findOverrideValue, PLAN_OVERRIDE_ITEMS } from '../lib/planOverrides'
import { findCurrentRowIndex } from '../lib/planTime'
import { resolveReasons } from '../lib/reasons'
import { formatOverrideTime } from '../lib/time'
import { OverrideMenu } from './OverrideMenu'
import type { PlanTableProps } from './PlanTable'
import { RateOverrideMenu } from './RateOverrideMenu'
import { ReasonTooltip } from './ReasonTooltip'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** The state chip - a single tone, or a two-tone split when `state2_text` is set (matches `DesktopPlanTable`'s state cell). */
function StateChip({ row, isDark }: { row: PlanRow; isDark: boolean }) {
  if (row.state2_text) {
    return (
      <span className="inline-flex overflow-hidden rounded-md text-xs font-semibold" data-testid="mobile-state-split">
        <span
          className="px-2 py-1"
          data-testid="mobile-state-half-1"
          style={{ backgroundColor: cellBackground(row.state_color, isDark), color: textColorForBg(cellBackground(row.state_color, isDark)) }}
        >
          {row.state_text}
        </span>
        <span
          className="px-2 py-1"
          data-testid="mobile-state-half-2"
          style={{ backgroundColor: cellBackground(row.state2_color, isDark), color: textColorForBg(cellBackground(row.state2_color, isDark)) }}
        >
          {row.state2_text}
        </span>
      </span>
    )
  }

  return (
    <span
      className="inline-block rounded-md px-2 py-1 text-xs font-semibold"
      data-testid="mobile-state-single"
      style={{ backgroundColor: cellBackground(row.state_color, isDark), color: textColorForBg(cellBackground(row.state_color, isDark)) }}
    >
      {row.state_text}
    </span>
  )
}

/** A label + value override field for the expanded detail panel - the card-list equivalent of `DesktopPlanTable`'s `ValueOverrideCell`, minus the `<td>` wrapper. */
function MobileValueField({
  label,
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
}: {
  label: string
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
}) {
  const rateOverride = useRateOverride()
  const active = overrideValue !== null

  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
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
    </div>
  )
}

/** A plain (non-overridable) label + value pair for the expanded detail panel, e.g. PV forecast or a debug-only field. */
function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

function PlanMobileRow({
  row,
  overrides,
  reasonTemplates,
  isNow,
  isDark,
  showCar,
  showIboost,
  showCarbon,
  debugColumns,
  cardRef,
}: {
  row: PlanRow
  overrides: PlanOverrides | undefined
  reasonTemplates: Record<string, string> | undefined
  isNow: boolean
  isDark: boolean
  showCar: boolean
  showIboost: boolean
  showCarbon: boolean
  debugColumns: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const planOverride = usePlanOverride()
  const reasonTexts = resolveReasons(row.reasons, reasonTemplates)
  const activeState = activePlanOverride(row.slot_minute, overrides)
  const menuLabel = `Override ${formatOverrideTime(row.time)} slot`
  const detailId = `mobile-row-detail-${row.slot_minute}`

  return (
    <div
      ref={cardRef}
      data-testid={isNow ? 'mobile-now-row' : undefined}
      aria-current={isNow ? 'time' : undefined}
      className={`px-4 py-3 ${isNow ? 'bg-sky-100 outline outline-2 -outline-offset-2 outline-sky-500 dark:bg-sky-950/50 dark:outline-sky-400' : 'bg-white dark:bg-slate-900'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <OverrideMenu
          menuLabel={menuLabel}
          active={activeState !== null}
          trigger={
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatTime(row.time)}
              {isNow && (
                <span className="ml-1.5 rounded-full bg-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-200">NOW</span>
              )}
              {activeState && <span className="ml-1.5 text-[0.65rem] font-normal text-amber-700 dark:text-amber-400">({activeState})</span>}
            </span>
          }
          items={PLAN_OVERRIDE_ITEMS.map(({ label, action }) => ({
            label,
            onSelect: () => planOverride.mutate({ time: formatOverrideTime(row.time), action }),
          }))}
        />
        <span className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{row.total_cost.toFixed(2)}</span>
      </div>

      <div className="mt-1.5 flex min-h-[44px] items-center justify-between gap-2">
        <ReasonTooltip reasons={reasonTexts}>
          <StateChip row={row} isDark={isDark} />
        </ReasonTooltip>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-1 text-xs text-slate-500 dark:text-slate-400"
        >
          {row.import_rate.toFixed(2)}p &middot; SOC {row.soc_percent.toFixed(0)}%
          <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
        </button>
      </div>

      {expanded && (
        <div id={detailId} className="mt-2 grid grid-cols-2 gap-x-4 border-t border-dashed border-slate-200 pt-2 dark:border-slate-700" data-testid="mobile-row-detail">
          <MobileValueField
            label="Export p/kWh"
            time={row.time}
            displayValue={row.export_rate}
            overrideValue={findOverrideValue(overrides?.manual_export_rates, row.slot_minute, (e) => e.rate)}
            setAction="Set Export"
            clearAction="Clear Export"
            setLabel="Set Export Rate"
            clearLabel="Clear Export Rate"
            menuLabel={`Override export rate at ${formatOverrideTime(row.time)}`}
            formatValue={(v) => v.toFixed(2)}
          />
          <MobileValueField
            label="Load kWh"
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
          <MobileField label="PV kWh" value={row.pv_forecast.toFixed(2)} />
          <MobileValueField
            label="SOC %"
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
          {showCar && <MobileField label="Car kWh" value={(row.car_charging ?? 0).toFixed(2)} />}
          {showIboost && <MobileField label="iBoost kWh" value={(row.iboost ?? 0).toFixed(2)} />}
          {showCarbon && <MobileField label="CO2 g/kWh" value={(row.carbon_intensity ?? 0).toFixed(0)} />}
          {showCarbon && <MobileField label="CO2 kg" value={(row.total_carbon ?? 0).toFixed(2)} />}
          {debugColumns && <MobileField label="Import eff" value={row.import_rate_adjusted.toFixed(2)} />}
          {debugColumns && <MobileField label="Export eff" value={row.export_rate_adjusted.toFixed(2)} />}
          {debugColumns && <MobileField label="Clip kWh" value={row.clipped.toFixed(2)} />}
          {debugColumns && <MobileField label="XLoad kWh" value={(row.extra_load ?? 0).toFixed(2)} />}
        </div>
      )}
    </div>
  )
}

/**
 * The plan table as a two-line card list, used below `md` instead of
 * `DesktopPlanTable` - a multi-column data grid doesn't fit a phone screen,
 * however much it scrolls (see the Known gaps note this replaced in
 * CLAUDE.md). Each card shows Time/Cost and State/rate up front; tapping the
 * summary line expands PV/Load/Export/Total (and conditional/debug fields)
 * below it, mirroring the desktop table's remaining columns.
 */
export function PlanTableMobile({ plan, overrides, debugColumns = false }: PlanTableProps) {
  const { rows } = plan
  const showCar = plan.num_cars > 0
  const showIboost = plan.iboost_enable
  const showCarbon = plan.carbon_enable
  const isDark = useIsDarkMode()

  const now = useNow()
  const currentRowIndex = findCurrentRowIndex(rows, now)
  const currentRowRef = useRef<HTMLDivElement | null>(null)
  const hasAutoScrolled = useRef(false)

  useEffect(() => {
    if (!hasAutoScrolled.current && currentRowIndex >= 0 && currentRowRef.current) {
      currentRowRef.current.scrollIntoView?.({ block: 'center' })
      hasAutoScrolled.current = true
    }
  }, [currentRowIndex])

  return (
    <div className="max-h-[32rem] divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800" data-testid="mobile-plan-list">
      {rows.map((row, index) => (
        <PlanMobileRow
          key={row.time}
          row={row}
          overrides={overrides}
          reasonTemplates={plan.reason_templates}
          isNow={index === currentRowIndex}
          isDark={isDark}
          showCar={showCar}
          showIboost={showIboost}
          showCarbon={showCarbon}
          debugColumns={debugColumns}
          cardRef={index === currentRowIndex ? (el) => (currentRowRef.current = el) : undefined}
        />
      ))}
    </div>
  )
}
