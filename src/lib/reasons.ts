import type { PlanReason } from '../api/types'

/**
 * Expands one plan-row reason against `RawPlan.reason_templates` -
 * `output.py`'s `REASON_TEMPLATES` (~lines 32-53) - substituting
 * `{placeholder}` names in the template with the reason's own params. Falls
 * back to the raw code if the template is missing (an older Predbat that
 * hasn't shipped a template for a newer code yet).
 */
export function resolveReason(reason: PlanReason, templates: Record<string, string>): string {
  const template = templates[reason.code]
  if (!template) return reason.code
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = reason.params[key]
    return value === undefined ? match : String(value)
  })
}

/** Expands every reason on a row into human-readable sentences, in order. */
export function resolveReasons(reasons: PlanReason[] | undefined, templates: Record<string, string> | undefined): string[] {
  if (!reasons || reasons.length === 0) return []
  return reasons.map((reason) => resolveReason(reason, templates ?? {}))
}
