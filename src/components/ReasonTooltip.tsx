import { useId, useState, type ReactNode } from 'react'

/**
 * Wraps plan-cell content with a "why" explanation: a hover tooltip for
 * mouse/keyboard users, and the same panel toggled by tap on touch devices
 * (a touch's synthesized click event drives the same `onClick` handler).
 * Renders `children` unwrapped when there is nothing to explain.
 */
export function ReasonTooltip({ reasons, children }: { reasons: string[]; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  if (reasons.length === 0) {
    return <>{children}</>
  }

  return (
    <div className="relative h-full w-full">
      <div
        role="button"
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        className="h-full w-full cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen((value) => !value)
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
      >
        {children}
      </div>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-slate-300 bg-white p-2 text-xs font-normal normal-case text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {reasons.map((reason, index) => (
            <p key={index} className={index > 0 ? 'mt-1' : undefined}>
              {reason}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
