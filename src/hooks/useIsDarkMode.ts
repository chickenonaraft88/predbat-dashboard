import { useEffect, useState } from 'react'

function documentIsDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/** Tracks whether the document currently has Tailwind's class-based `dark` variant active on `<html>`, however it got there (OS preference via `useSystemTheme`, or a future manual toggle). */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(documentIsDark)

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(() => setIsDark(documentIsDark()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
