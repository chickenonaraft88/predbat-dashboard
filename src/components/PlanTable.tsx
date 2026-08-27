import type { PlanRow, RawPlan } from '../api/types'
import { textColorForBg } from '../lib/planColors'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sumRows(rows: PlanRow[], key: keyof PlanRow): number {
  return rows.reduce((total, row) => {
    const value = row[key]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

export function PlanTable({ plan }: { plan: RawPlan }) {
  const { rows } = plan
  const showCar = plan.num_cars > 0
  const showIboost = plan.iboost_enable
  const showCarbon = plan.carbon_enable

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
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2 text-right">Import p/kWh</th>
            <th className="px-3 py-2 text-right">Import adj</th>
            <th className="px-3 py-2 text-right">Export p/kWh</th>
            <th className="px-3 py-2 text-right">Export adj</th>
            <th className="px-3 py-2 text-right">PV kWh</th>
            <th className="px-3 py-2 text-right">Load kWh</th>
            <th className="px-3 py-2 text-right">Clip kWh</th>
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
          {rows.map((row) => (
            <tr key={row.time} className="bg-white odd:bg-slate-50 dark:bg-slate-900 dark:odd:bg-slate-950/40">
              <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{formatTime(row.time)}</td>
              <td className="p-0 font-medium" data-testid="state-cell">
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
              </td>
              <td className="px-3 py-1.5 text-right" style={{ backgroundColor: row.rate_color_import || undefined, color: textColorForBg(row.rate_color_import) }}>
                {row.import_rate.toFixed(2)}
              </td>
              <td className="px-3 py-1.5 text-right">{row.import_rate_adjusted.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right" style={{ backgroundColor: row.rate_color_export || undefined, color: textColorForBg(row.rate_color_export) }}>
                {row.export_rate.toFixed(2)}
              </td>
              <td className="px-3 py-1.5 text-right">{row.export_rate_adjusted.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.pv_forecast.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.load_forecast.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.clipped.toFixed(2)}</td>
              {showCar && <td className="px-3 py-1.5 text-right">{(row.car_charging ?? 0).toFixed(2)}</td>}
              {showIboost && <td className="px-3 py-1.5 text-right">{(row.iboost ?? 0).toFixed(2)}</td>}
              {showCarbon && <td className="px-3 py-1.5 text-right">{(row.carbon_intensity ?? 0).toFixed(0)}</td>}
              {showCarbon && <td className="px-3 py-1.5 text-right">{(row.total_carbon ?? 0).toFixed(2)}</td>}
              <td className="px-3 py-1.5 text-right">{row.soc_percent.toFixed(0)}</td>
              <td className="px-3 py-1.5 text-right">{row.cost_change.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right">{row.total_cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-900">
            <td className="px-3 py-1.5" colSpan={6}>
              Totals
            </td>
            <td className="px-3 py-1.5 text-right">{totals.pv_forecast.toFixed(2)}</td>
            <td className="px-3 py-1.5 text-right">{totals.load_forecast.toFixed(2)}</td>
            <td className="px-3 py-1.5 text-right">{totals.clipped.toFixed(2)}</td>
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
