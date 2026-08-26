import { createContext, useContext } from 'react'

const STORAGE_KEY = 'predbat-dashboard:base-url'
export const DEFAULT_BASE_URL = 'http://localhost:5052'

export function loadStoredBaseUrl(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BASE_URL
  } catch {
    // localStorage can throw in a locked-down browser context (private mode, blocked storage).
    return DEFAULT_BASE_URL
  }
}

export function storeBaseUrl(baseUrl: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, baseUrl)
  } catch {
    // Ignore - the value just won't survive a reload.
  }
}

export interface ConnectionState {
  baseUrl: string
  setBaseUrl: (baseUrl: string) => void
}

export const ConnectionContext = createContext<ConnectionState | null>(null)

export function useConnection(): ConnectionState {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}
