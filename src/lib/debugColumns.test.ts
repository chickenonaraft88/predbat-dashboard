import { afterEach, describe, expect, it } from 'vitest'

import { loadDebugColumnsPref, storeDebugColumnsPref } from './debugColumns'

afterEach(() => {
  window.localStorage.clear()
})

describe('debugColumns', () => {
  it('defaults to disabled when nothing is stored', () => {
    expect(loadDebugColumnsPref()).toBe(false)
  })

  it('round-trips a stored true/false preference', () => {
    storeDebugColumnsPref(true)
    expect(loadDebugColumnsPref()).toBe(true)

    storeDebugColumnsPref(false)
    expect(loadDebugColumnsPref()).toBe(false)
  })

  it('falls back to false when localStorage throws', () => {
    const original = window.localStorage.getItem
    window.localStorage.getItem = () => {
      throw new Error('blocked')
    }
    try {
      expect(loadDebugColumnsPref()).toBe(false)
    } finally {
      window.localStorage.getItem = original
    }
  })
})
