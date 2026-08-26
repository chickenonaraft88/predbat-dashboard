import { usePlanData, useStatus } from '../hooks/usePredbat'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  )
}

export function StatusCard() {
  const status = useStatus()
  const planData = usePlanData()
  const plan = planData.data?.plan

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Calculating" value={status.data?.calculating ? 'Yes' : 'No'} />
      <Stat label="Battery SOC" value={plan ? `${Math.round((plan.soc / plan.soc_max) * 100)}%` : '-'} />
      <Stat label="Mode" value={plan?.mode ?? '-'} />
      <Stat label="Plan updated" value={plan?.timestamp ? new Date(plan.timestamp).toLocaleTimeString() : '-'} />
    </div>
  )
}
