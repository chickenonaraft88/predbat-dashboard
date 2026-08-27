import type { PlanRow } from '../api/types'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Per-row actual-vs-planned comparison for a past day. Predbat's `yesterday`
 * plan has no separate "planned" dataset embedded in it - `state_target` (the
 * target SOC% set whenever a charge/export window applied) is the plan, and
 * `soc_percent` (the SOC% actually reached) is the outcome, so this table
 * pairs those two fields per row instead of rendering a second series.
 */
export function HistoryTable({ rows }: { rows: PlanRow[] }) {
  return (
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2 text-right">Target SOC %</th>
            <th className="px-3 py-2 text-right">Actual SOC %</th>
            <th className="px-3 py-2 text-right">Difference</th>
            <th className="px-3 py-2 text-right">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => {
            const target = row.state_target === null || row.state_target === '' ? null : Number(row.state_target)
            const diff = target === null || Number.isNaN(target) ? null : row.soc_percent - target
            return (
              <tr key={row.time} className="bg-white odd:bg-slate-50 dark:bg-slate-900 dark:odd:bg-slate-950/40">
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{formatTime(row.time)}</td>
                <td className="px-3 py-1.5" style={{ color: row.state_color || undefined }}>
                  {row.state_text}
                </td>
                <td className="px-3 py-1.5 text-right">{target === null || Number.isNaN(target) ? '-' : target.toFixed(0)}</td>
                <td className="px-3 py-1.5 text-right">{row.soc_percent.toFixed(0)}</td>
                <td className={`px-3 py-1.5 text-right ${diff !== null && diff < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {diff === null ? '-' : `${diff > 0 ? '+' : ''}${diff.toFixed(0)}`}
                </td>
                <td className="px-3 py-1.5 text-right">{row.total_cost.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
