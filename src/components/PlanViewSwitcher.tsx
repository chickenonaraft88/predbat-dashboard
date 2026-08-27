export type PlanView = 'plan' | 'history' | 'baseline'

const VIEWS: Array<{ id: PlanView; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'history', label: 'History' },
  { id: 'baseline', label: 'Yesterday without Predbat' },
]

export function PlanViewSwitcher({ value, onChange }: { value: PlanView; onChange: (view: PlanView) => void }) {
  return (
    <div role="tablist" aria-label="Plan view" className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={value === view.id}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === view.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
