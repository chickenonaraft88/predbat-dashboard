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
  /** Minutes-from-midnight (matches `PlanRow.slot_minute`) of slots under each manual state override. */
  manual_charge_times: number[]
  manual_export_times: number[]
  manual_freeze_charge_times: number[]
  manual_freeze_export_times: number[]
  manual_demand_times: number[]
  manual_import_rates: ManualRateEntry[]
  manual_export_rates: ManualRateEntry[]
  manual_load_adjust: Array<{ minutes: number; adjustment: number }>
  manual_soc: Array<{ minutes: number; target: number }>
}

/** The action a `POST /plan_override` request applies to a slot (issue #15). */
export type PlanOverrideAction = 'Manual Demand' | 'Manual Charge' | 'Manual Export' | 'Manual Freeze Charge' | 'Manual Freeze Export' | 'Clear'

/** Body of a `POST /plan_override` request - form-encoded, not JSON. */
export interface PlanOverridePayload {
  /** `"<Mon|Tue|...> HH:MM"` in Predbat's configured timezone - see `formatOverrideTime`. */
  time: string
  action: PlanOverrideAction
}

/** The action a `POST /rate_override` request applies to a slot (issue #16). */
export type RateOverrideAction = 'Set Import' | 'Clear Import' | 'Set Export' | 'Clear Export' | 'Set Load' | 'Clear Load' | 'Set SOC' | 'Clear SOC'

/** Body of a `POST /rate_override` request - form-encoded, not JSON. */
export interface RateOverridePayload {
  /** `"<Mon|Tue|...> HH:MM"` in Predbat's configured timezone - see `formatOverrideTime`. */
  time: string
  action: RateOverrideAction
  /** Import/export rate in p/kWh, load in kWh, or SOC in % - as a string. Required even for `Clear *` actions, which ignore it server-side. */
  rate: string
}

/** Response from `POST /plan_override` and `POST /rate_override`. */
export interface OverrideResponse {
  success: boolean
  message?: string
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
