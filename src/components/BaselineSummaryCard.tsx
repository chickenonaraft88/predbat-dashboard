import type { PlanTotals } from '../api/types'

function formatCurrency(value: number) {
  return value.toFixed(2)
}

/**
 * Headline "what Predbat saved yesterday" figure: the cost of the simulated
 * no-optimizer baseline strategy minus what Predbat's plan actually cost.
 * A positive value means Predbat beat the baseline.
 */
export function BaselineSummaryCard({ actual, baseline }: { actual?: PlanTotals; baseline?: PlanTotals }) {
  if (!actual || !baseline) {
    return null
  }

  const savings = baseline.total_cost - actual.total_cost

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Actual cost (with Predbat)</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(actual.total_cost)}</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Baseline cost (without Predbat)</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(baseline.total_cost)}</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Savings</div>
        <div className={`mt-1 text-2xl font-semibold ${savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {savings >= 0 ? '+' : ''}
          {formatCurrency(savings)}
        </div>
      </div>
    </div>
  )
}
