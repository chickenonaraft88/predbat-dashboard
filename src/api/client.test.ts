import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { DEFAULT_BASE_URL } from './connection'
import { predbatApi, PredbatApiError } from './client'
import { server } from '../test/msw/server'

describe('predbatApi', () => {
  it('ping() resolves with the parsed JSON body', async () => {
    await expect(predbatApi.ping(DEFAULT_BASE_URL)).resolves.toEqual({ result: 'ok' })
  })

  it('planData() forwards newestTimestamp/overridesHash as query params', async () => {
    let capturedUrl: URL | undefined
    server.use(
      http.get(`${DEFAULT_BASE_URL}/api/plan_data`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({ unchanged: true, overrides_hash: 'abc' })
      }),
    )

    await predbatApi.planData(DEFAULT_BASE_URL, { newestTimestamp: '2026-08-26T12:00:00+01:00', overridesHash: 'abc' })

    expect(capturedUrl?.searchParams.get('newest_timestamp')).toBe('2026-08-26T12:00:00+01:00')
    expect(capturedUrl?.searchParams.get('overrides_hash')).toBe('abc')
  })

  it('throws a PredbatApiError carrying the HTTP status on a non-2xx response', async () => {
    server.use(http.get(`${DEFAULT_BASE_URL}/api/status`, () => new HttpResponse(null, { status: 503 })))

    await expect(predbatApi.status(DEFAULT_BASE_URL)).rejects.toMatchObject({
      name: 'PredbatApiError',
      status: 503,
    })
  })

  it('throws a CORS-hinting PredbatApiError when the request fails at the network level', async () => {
    server.use(http.get(`${DEFAULT_BASE_URL}/api/ping`, () => HttpResponse.error()))

    const error = await predbatApi.ping(DEFAULT_BASE_URL).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(PredbatApiError)
    expect((error as PredbatApiError).message).toContain('web_cors_origins')
  })
})
