import type { OverrideResponse, PingResponse, PlanDataResponse, PlanOverridePayload, RateOverridePayload, StatusResponse } from './types'

export class PredbatApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'PredbatApiError'
    this.status = status
  }
}

async function getJson<T>(baseUrl: string, path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, baseUrl)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  let response: Response
  try {
    response = await fetch(url, { method: 'GET' })
  } catch {
    // A network/CORS failure here almost always means the target Predbat instance
    // has not set web_cors_origins to include this dashboard's origin.
    throw new PredbatApiError(`Could not reach Predbat at ${baseUrl}. Check the URL and that web_cors_origins in apps.yaml includes this page's origin.`)
  }

  if (!response.ok) {
    throw new PredbatApiError(`Predbat API returned ${response.status} for ${path}`, response.status)
  }

  return (await response.json()) as T
}

async function postForm<T>(baseUrl: string, path: string, body: Record<string, string>): Promise<T> {
  const url = new URL(path, baseUrl)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    })
  } catch {
    // A network/CORS failure here almost always means the target Predbat instance
    // has not set web_cors_origins to include this dashboard's origin.
    throw new PredbatApiError(`Could not reach Predbat at ${baseUrl}. Check the URL and that web_cors_origins in apps.yaml includes this page's origin.`)
  }

  if (!response.ok) {
    throw new PredbatApiError(`Predbat API returned ${response.status} for ${path}`, response.status)
  }

  return (await response.json()) as T
}

/**
 * Thin wrapper over Predbat's built-in JSON API (see apps/predbat/web.py in
 * batpred). Query methods are plain GETs against the configured base URL;
 * the override methods below POST form-encoded bodies to Predbat's plan/rate
 * override routes (these are not under `/api/`, matching web.py's routing).
 */
export const predbatApi = {
  ping(baseUrl: string) {
    return getJson<PingResponse>(baseUrl, '/api/ping')
  },

  status(baseUrl: string) {
    return getJson<StatusResponse>(baseUrl, '/api/status')
  },

  planData(baseUrl: string, opts?: { newestTimestamp?: string; overridesHash?: string }) {
    const params: Record<string, string> = {}
    if (opts?.newestTimestamp) params.newest_timestamp = opts.newestTimestamp
    if (opts?.overridesHash) params.overrides_hash = opts.overridesHash
    return getJson<PlanDataResponse>(baseUrl, '/api/plan_data', params)
  },

  state<T = Record<string, unknown>>(baseUrl: string, entityId: string) {
    return getJson<T>(baseUrl, '/api/state', { entity_id: entityId })
  },

  /** Sets or clears a manual state override (Charge/Export/Freeze/Demand) on a slot. */
  planOverride(baseUrl: string, payload: PlanOverridePayload) {
    // Every field of PlanOverridePayload is a string (or a string-literal union, itself a
    // string), so this is a safe reshape - TS just doesn't infer an index signature for it.
    return postForm<OverrideResponse>(baseUrl, '/plan_override', { ...payload })
  },

  /** Sets or clears a manual value override (import/export rate, load, SOC) on a slot. */
  rateOverride(baseUrl: string, payload: RateOverridePayload) {
    return postForm<OverrideResponse>(baseUrl, '/rate_override', { ...payload })
  },
}
