import { useState, type ReactNode } from 'react'

import { OverrideMenu } from './OverrideMenu'

/**
 * A value-override menu for a plan cell (import/export rate, SOC, load -
 * issue #16). Reuses `OverrideMenu` for the open/close/outside-click
 * mechanics; the "Set ..." item switches to an inline numeric input instead
 * of firing immediately, since `POST /rate_override` needs a value.
 */
export function RateOverrideMenu({
  trigger,
  menuLabel,
  setLabel,
  clearLabel,
  active,
  inputStep = 'any',
  onSet,
  onClear,
}: {
  trigger: ReactNode
  menuLabel: string
  setLabel: string
  clearLabel: string
  active: boolean
  inputStep?: string
  onSet: (rate: string) => void
  onClear: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (editing) {
    return (
      <form
        className="inline-flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault()
          const value = draft.trim()
          if (value === '') return
          onSet(value)
          setEditing(false)
          setDraft('')
        }}
      >
        <input
          autoFocus
          type="number"
          step={inputStep}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`${setLabel} value`}
          className="w-16 rounded border border-slate-300 px-1 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-800"
        />
        <button type="submit" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          Save
        </button>
        <button
          type="button"
          className="text-xs text-slate-500 hover:underline dark:text-slate-400"
          onClick={() => {
            setEditing(false)
            setDraft('')
          }}
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <OverrideMenu
      trigger={trigger}
      menuLabel={menuLabel}
      active={active}
      items={[
        { label: setLabel, onSelect: () => setEditing(true) },
        { label: clearLabel, onSelect: onClear },
      ]}
    />
  )
}
