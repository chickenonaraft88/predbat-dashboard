import { describe, expect, it } from 'vitest'

import { resolveReason, resolveReasons } from './reasons'

const templates = {
  demand_steady: 'Demand — battery level is expected to stay steady; no charging or exporting is scheduled this slot.',
  charge_low_rate: 'Charging up to {target_percent}% at {rate_kw}kW at the import rate for this slot of ({rate}p/kWh).',
}

describe('resolveReason', () => {
  it('substitutes {placeholder} params into the matching template', () => {
    const text = resolveReason({ code: 'charge_low_rate', params: { target_percent: 80, rate_kw: '3.50', rate: '12.34' } }, templates)
    expect(text).toBe('Charging up to 80% at 3.50kW at the import rate for this slot of (12.34p/kWh).')
  })

  it('returns a template with no placeholders unchanged', () => {
    expect(resolveReason({ code: 'demand_steady', params: {} }, templates)).toBe(templates.demand_steady)
  })

  it('falls back to the raw code when no template matches', () => {
    expect(resolveReason({ code: 'unknown_code', params: {} }, templates)).toBe('unknown_code')
  })

  it('leaves an unresolved placeholder in place when the param is missing', () => {
    expect(resolveReason({ code: 'charge_low_rate', params: { target_percent: 80 } }, templates)).toContain('{rate_kw}')
  })
})

describe('resolveReasons', () => {
  it('resolves every reason in order', () => {
    const result = resolveReasons([{ code: 'demand_steady', params: {} }, { code: 'unknown', params: {} }], templates)
    expect(result).toEqual([templates.demand_steady, 'unknown'])
  })

  it('returns an empty array for undefined/empty reasons', () => {
    expect(resolveReasons(undefined, templates)).toEqual([])
    expect(resolveReasons([], templates)).toEqual([])
  })
})
