import type { PingResponse, PlanDataResponse, StatusResponse } from './types'

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

/**
 * Thin wrapper over Predbat's built-in JSON API (see apps/predbat/web.py in
 * batpred). Every method is a plain GET against the configured base URL - no
 * mutation endpoints are wired up yet.
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
}
