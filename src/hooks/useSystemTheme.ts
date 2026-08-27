import { useEffect } from 'react'

/**
 * Keeps `<html>`'s Tailwind `dark` class in sync with the OS `prefers-color-scheme`
 * preference. Mount once at the app root - `dark:` classes throughout the app already
 * assume this class exists when the OS is in dark mode, but nothing previously set it.
 */
export function useSystemTheme(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', mql.matches)
    apply()
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [])
}
