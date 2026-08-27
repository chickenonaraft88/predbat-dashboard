import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { predbatApi } from '../api/client'
import { useConnection } from '../api/connection'
import type { OverrideResponse, PlanDataResponse, PlanOverridePayload, RateOverridePayload } from '../api/types'

const POLL_INTERVAL_MS = 5000

type PlanDataSuccess = Exclude<PlanDataResponse, { unchanged: true }>

export function usePing() {
  const { baseUrl } = useConnection()
  return useQuery({
    queryKey: ['ping', baseUrl],
    queryFn: () => predbatApi.ping(baseUrl),
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  })
}

export function useStatus() {
  const { baseUrl } = useConnection()
  return useQuery({
    queryKey: ['status', baseUrl],
    queryFn: () => predbatApi.status(baseUrl),
    refetchInterval: POLL_INTERVAL_MS,
  })
}

/**
 * Polls /api/plan_data. Predbat replies `{unchanged: true}` once nothing has
 * moved since the last poll, so this feeds back the previous poll's
 * timestamp/hash and keeps serving that cached payload instead of blanking
 * the dashboard on every unchanged tick.
 */
export function usePlanData() {
  const { baseUrl } = useConnection()
  const queryClient = useQueryClient()
  const queryKey = ['plan_data', baseUrl]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<PlanDataSuccess> => {
      const previous = queryClient.getQueryData<PlanDataSuccess>(queryKey)
      const result = await predbatApi.planData(baseUrl, {
        newestTimestamp: previous?.plan?.timestamp,
        overridesHash: previous?.overrides_hash,
      })
      if (result.unchanged) {
        if (previous) return previous
        throw new Error('Predbat has no plan data yet')
      }
      return result
    },
    refetchInterval: POLL_INTERVAL_MS,
  })
}

/**
 * Shared plumbing for the override mutations below: POST a payload via the
 * given client method, then invalidate `plan_data` so the next poll (or an
 * immediate refetch, since the query is active) picks up the new
 * `overrides`/`overrides_hash`.
 */
function useOverrideMutation<TPayload>(post: (baseUrl: string, payload: TPayload) => Promise<OverrideResponse>) {
  const { baseUrl } = useConnection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TPayload) => post(baseUrl, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan_data', baseUrl] }),
  })
}

/** Sets or clears a manual state override (Charge/Export/Freeze/Demand) on a slot - issue #15. */
export function usePlanOverride() {
  return useOverrideMutation<PlanOverridePayload>(predbatApi.planOverride)
}

/** Sets or clears a manual value override (import/export rate, load, SOC) on a slot - issue #16. */
export function useRateOverride() {
  return useOverrideMutation<RateOverridePayload>(predbatApi.rateOverride)
}
