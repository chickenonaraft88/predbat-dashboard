// Shapes returned by Predbat's built-in JSON API (apps/predbat/web.py in the
// batpred repo). These mirror the fields Predbat actually serialises today
// (see output.py's `publish_html_plan` for the plan row fields) - if a future
// Predbat release adds or renames fields, update this file to match.

export interface PlanRow {
  time: string
  slot_minute: number
  import_rate: number
  export_rate: number
  import_rate_adjusted: number
  export_rate_adjusted: number
  state: string
  state_target: string | null
  state_override: string | null
  state_html: string
  reasons: string
  state_text: string
  state_color: string
  state2_text: string | null
  state2_color: string | null
  soc_percent: number
  soc_change: number
  soc_sym: string
  cost_change: number
  total_cost: number
  pv_forecast: number
  pv_forecast_total: number
  load_forecast: number
  load_forecast_total: number
  clipped: number
  car_charging?: number
  iboost?: number
  carbon_intensity?: number
  total_carbon?: number
}

/** Aggregate totals published alongside a plan's rows (see `totals` in RawPlan). */
export interface PlanTotals {
  total_cost: number
  pv_forecast: number
  load_forecast: number
  clipped: number
  soc_percent: number
  extra_load?: number
  car_charging?: number
  iboost?: number
  carbon_intensity?: number
  total_carbon?: number
}

export interface RawPlan {
  rows: PlanRow[]
  totals?: PlanTotals
  soc: number
  soc_max: number
  reserve: number
  time: string
  mode: string
  forecast_minutes: number
  end_record: number
  end_plan: number
  num_cars: number
  iboost_enable: boolean
  carbon_enable: boolean
  currency_symbols: string[] | string
  timestamp: string
}

// `yesterday` and `baseline` are produced by the same publish_html_plan() call
// as the live plan (see apps/predbat/output.py in batpred) and are
// structurally identical to RawPlan - `yesterday` is what actually happened,
// `baseline` is a simulated "charge to full in the cheapest slot" strategy
// standing in for "no Predbat optimizer".
export type YesterdayJson = RawPlan

export type BaselineJson = RawPlan

export interface ManualRateEntry {
  minutes: number
  rate: number
}

export interface PlanOverrides {
  manual_charge_times: unknown
  manual_export_times: unknown
  manual_freeze_charge_times: unknown
  manual_freeze_export_times: unknown
  manual_demand_times: unknown
  manual_import_rates: ManualRateEntry[]
  manual_export_rates: ManualRateEntry[]
  manual_load_adjust: Array<{ minutes: number; adjustment: number }>
  manual_soc: Array<{ minutes: number; target: number }>
}

/** Response from GET /api/plan_data. */
export type PlanDataResponse =
  | { unchanged: true; overrides_hash: string }
  | {
      unchanged: false
      plan: RawPlan | null
      yesterday: YesterdayJson | null
      baseline: BaselineJson | null
      overrides: PlanOverrides
      overrides_hash: string
    }

/** A single Home Assistant-style entity state, as returned by /api/state. */
export interface EntityState {
  state: string
  attributes: Record<string, unknown>
  last_changed?: string
  last_updated?: string
}

/** Response from GET /api/status. */
export interface StatusResponse {
  calculating: boolean
  battery_html: string
}

/** Response from GET /api/ping. */
export interface PingResponse {
  result: 'ok' | 'error'
}
