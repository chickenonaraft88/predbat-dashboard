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
    state_color: '#888888',
    state2_text: null,
    state2_color: null,
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

export const sampleYesterdayRows: PlanRow[] = [
  makePlanRow({
    time: '2026-08-25T00:00:00+01:00',
    state_text: 'Charging',
    state_target: '80',
    soc_percent: 75,
    total_cost: 0.42,
  }),
  makePlanRow({
    time: '2026-08-25T04:00:00+01:00',
    state_text: 'Idle',
    state_target: null,
    soc_percent: 74,
    total_cost: 0.42,
  }),
  makePlanRow({
    time: '2026-08-25T08:00:00+01:00',
    state_text: 'Exporting',
    state_target: '40',
    soc_percent: 46,
    total_cost: 1.1,
  }),
]

export const sampleBaselineRows: PlanRow[] = [
  makePlanRow({
    time: '2026-08-25T00:00:00+01:00',
    state_text: 'Charging',
    state_target: '100',
    soc_percent: 100,
    total_cost: 0.6,
  }),
  makePlanRow({
    time: '2026-08-25T04:00:00+01:00',
    state_text: 'Idle',
    state_target: null,
    soc_percent: 92,
    total_cost: 1.9,
  }),
  makePlanRow({
    time: '2026-08-25T08:00:00+01:00',
    state_text: 'Idle',
    state_target: null,
    soc_percent: 80,
    total_cost: 3.75,
  }),
]

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
  },
  yesterday: {
    rows: sampleYesterdayRows,
    totals: {
      total_cost: 1.94,
      pv_forecast: 4.2,
      load_forecast: 9.1,
      clipped: 0,
      soc_percent: 46,
    },
    soc: 4.6,
    soc_max: 10,
    reserve: 1,
    time: '2026-08-25T00:00:00+01:00',
    mode: 'Charge',
    forecast_minutes: 2880,
    end_record: 288,
    end_plan: 288,
    num_cars: 0,
    iboost_enable: false,
    carbon_enable: false,
    currency_symbols: 'p',
    timestamp: '2026-08-25T23:55:00+01:00',
  },
  baseline: {
    rows: sampleBaselineRows,
    totals: {
      total_cost: 6.25,
      pv_forecast: 4.2,
      load_forecast: 9.1,
      clipped: 0,
      soc_percent: 80,
    },
    soc: 8,
    soc_max: 10,
    reserve: 1,
    time: '2026-08-25T00:00:00+01:00',
    mode: 'Charge',
    forecast_minutes: 2880,
    end_record: 288,
    end_plan: 288,
    num_cars: 0,
    iboost_enable: false,
    carbon_enable: false,
    currency_symbols: 'p',
    timestamp: '2026-08-25T23:55:00+01:00',
  },
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
