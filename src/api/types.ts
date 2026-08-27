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
  /** Threshold-banded background colour for the import/export rate cells (output.py ~1278-1333). */
  rate_color_import: string
  rate_color_export: string
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

/**
 * End-of-plan running totals (`output.py`'s `raw_plan["totals"]`, ~lines
 * 1776-1792). `extra_load`/`car_charging`/`iboost`/`carbon_intensity`/`total_carbon`
 * are only present when the corresponding plan feature is enabled/configured.
 */
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
  /** Absent on older Predbat releases - callers should fall back to summing `rows`. */
  totals?: PlanTotals
}

export interface YesterdayJson {
  timestamp?: string
  [key: string]: unknown
}

export interface BaselineJson {
  timestamp?: string
  [key: string]: unknown
}

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
