import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSystemTheme } from './useSystemTheme'

function Consumer() {
  useSystemTheme()
  return null
}

function fakeMediaQueryList(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<() => void>()
  return {
    get matches() {
      return matches
    },
    media: '',
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    set(value: boolean) {
      matches = value
      listeners.forEach((listener) => listener())
    },
  } as unknown as MediaQueryList & { set: (value: boolean) => void }
}

afterEach(() => {
  document.documentElement.classList.remove('dark')
  vi.restoreAllMocks()
})

describe('useSystemTheme', () => {
  it('adds the dark class on mount when the OS already prefers dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(fakeMediaQueryList(true))

    render(<Consumer />)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not add the dark class when the OS prefers light', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(fakeMediaQueryList(false))

    render(<Consumer />)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles the class live as the OS preference changes', () => {
    const mql = fakeMediaQueryList(false)
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql)

    render(<Consumer />)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    mql.set(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    mql.set(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
