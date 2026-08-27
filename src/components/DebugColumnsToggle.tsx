/** Checkbox controlling the plan table's debug column set (persisted via useDebugColumns). */
export function DebugColumnsToggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <label className="flex w-fit items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
      Show debug columns
    </label>
  )
}
