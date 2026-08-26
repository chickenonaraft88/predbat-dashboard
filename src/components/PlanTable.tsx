import type { PlanRow } from '../api/types'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PlanTable({ rows }: { rows: PlanRow[] }) {
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
              <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{formatTime(row.time)}</td>
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
