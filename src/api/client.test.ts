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

  it('planOverride() posts a form-encoded body to /plan_override', async () => {
    let contentType: string | null = null
    let body: URLSearchParams | undefined
    server.use(
      http.post(`${DEFAULT_BASE_URL}/plan_override`, async ({ request }) => {
        contentType = request.headers.get('content-type')
        body = new URLSearchParams(await request.text())
        return HttpResponse.json({ success: true })
      }),
    )

    await expect(predbatApi.planOverride(DEFAULT_BASE_URL, { time: 'Mon 14:30', action: 'Manual Charge' })).resolves.toEqual({ success: true })

    expect(contentType).toContain('application/x-www-form-urlencoded')
    expect(body?.get('time')).toBe('Mon 14:30')
    expect(body?.get('action')).toBe('Manual Charge')
  })

  it('rateOverride() posts a form-encoded body to /rate_override', async () => {
    let body: URLSearchParams | undefined
    server.use(
      http.post(`${DEFAULT_BASE_URL}/rate_override`, async ({ request }) => {
        body = new URLSearchParams(await request.text())
        return HttpResponse.json({ success: true })
      }),
    )

    await expect(predbatApi.rateOverride(DEFAULT_BASE_URL, { time: 'Tue 09:00', action: 'Set Import', rate: '12.5' })).resolves.toEqual({ success: true })

    expect(body?.get('time')).toBe('Tue 09:00')
    expect(body?.get('action')).toBe('Set Import')
    expect(body?.get('rate')).toBe('12.5')
  })

  it('planOverride() throws a PredbatApiError carrying the HTTP status on a non-2xx response', async () => {
    server.use(http.post(`${DEFAULT_BASE_URL}/plan_override`, () => new HttpResponse(null, { status: 400 })))

    await expect(predbatApi.planOverride(DEFAULT_BASE_URL, { time: 'Mon 14:30', action: 'Clear' })).rejects.toMatchObject({
      name: 'PredbatApiError',
      status: 400,
    })
  })
})
