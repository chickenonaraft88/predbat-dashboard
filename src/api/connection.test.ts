import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BASE_URL, loadStoredBaseUrl, storeBaseUrl } from './connection'

describe('connection storage', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loadStoredBaseUrl() falls back to the default when nothing is stored', () => {
    expect(loadStoredBaseUrl()).toBe(DEFAULT_BASE_URL)
  })

  it('storeBaseUrl() persists a value that loadStoredBaseUrl() then returns', () => {
    storeBaseUrl('http://example.local:5052')
    expect(loadStoredBaseUrl()).toBe('http://example.local:5052')
  })

  it('loadStoredBaseUrl() falls back to the default if localStorage throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadStoredBaseUrl()).toBe(DEFAULT_BASE_URL)
  })

  it('storeBaseUrl() swallows a localStorage write failure', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => storeBaseUrl('http://example.local:5052')).not.toThrow()
  })
})
