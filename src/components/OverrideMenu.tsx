import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface OverrideMenuItem {
  label: string
  onSelect: () => void
}

/**
 * A small click-to-open dropdown, used by PlanTable's cells to expose
 * Predbat's manual override actions (issues #15/#16). Closes on an outside
 * click, Escape, or after an item is chosen.
 */
export function OverrideMenu({
  trigger,
  items,
  menuLabel,
  active = false,
}: {
  trigger: ReactNode
  items: OverrideMenuItem[]
  menuLabel: string
  active?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={menuLabel}
        className={`cursor-pointer rounded px-1 hover:bg-slate-200 dark:hover:bg-slate-700 ${active ? 'bg-amber-100 ring-1 ring-amber-500 dark:bg-amber-900/40' : ''}`}
      >
        {trigger}
      </button>
      {open && (
        <ul
          role="menu"
          aria-label={menuLabel}
          className="absolute left-0 top-full z-10 mt-1 min-w-max rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className="block w-full whitespace-nowrap px-3 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
