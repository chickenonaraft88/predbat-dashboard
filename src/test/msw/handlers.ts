import { http, HttpResponse } from 'msw'

import { DEFAULT_BASE_URL } from '../../api/connection'
import type { PlanDataResponse, PlanRow } from '../../api/types'

export function makePlanRow(overrides: Partial<PlanRow> = {}): PlanRow {
  return {
    time: '2026-08-26T12:00:00+01:00',
    slot_minute: 0,
    import_rate: 24.5,
    export_rate: 15,
    import_rate_adjusted: 24.5,
    export_rate_adjusted: 15,
    state: 'Idle',
    state_target: null,
    state_override: null,
    state_html: 'Idle',
    reasons: '',
    state_text: 'Idle',
    state_color: '#FFFFFF',
    state2_text: null,
    state2_color: null,
    rate_color_import: '#FFFFAA',
    rate_color_export: '#dcdcdc',
    soc_percent: 62,
    soc_change: 0,
    soc_sym: '',
    cost_change: 0,
    total_cost: 1.23,
    pv_forecast: 0,
    pv_forecast_total: 0,
    load_forecast: 0.2,
    load_forecast_total: 0.2,
    clipped: 0,
    ...overrides,
  }
}

export const samplePlanData = {
  unchanged: false,
  plan: {
    rows: [makePlanRow()],
    soc: 6.2,
    soc_max: 10,
    reserve: 1,
    time: '2026-08-26T12:00:00+01:00',
    mode: 'Charge',
    forecast_minutes: 2880,
    end_record: 288,
    end_plan: 288,
    num_cars: 0,
    iboost_enable: false,
    carbon_enable: false,
    currency_symbols: 'p',
    timestamp: '2026-08-26T12:00:00+01:00',
    totals: {
      total_cost: 1.23,
      pv_forecast: 0,
      load_forecast: 0.2,
      clipped: 0,
      soc_percent: 62,
    },
  },
  yesterday: null,
  baseline: null,
  overrides: {
    manual_charge_times: [],
    manual_export_times: [],
    manual_freeze_charge_times: [],
    manual_freeze_export_times: [],
    manual_demand_times: [],
    manual_import_rates: [],
    manual_export_rates: [],
    manual_load_adjust: [],
    manual_soc: [],
  },
  overrides_hash: 'hash-1',
} satisfies PlanDataResponse

export const handlers = [
  http.get(`${DEFAULT_BASE_URL}/api/ping`, () => HttpResponse.json({ result: 'ok' })),
  http.get(`${DEFAULT_BASE_URL}/api/status`, () => HttpResponse.json({ calculating: false, battery_html: '' })),
  http.get(`${DEFAULT_BASE_URL}/api/plan_data`, () => HttpResponse.json(samplePlanData)),
]
