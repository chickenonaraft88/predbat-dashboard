const STORAGE_KEY = 'predbat-dashboard:plan-debug-columns'

/** Whether the plan table's debug columns (effective rate, PV10/Load10, clipped, XLoad) should show, persisted per-viewer. */
export function loadDebugColumnsPref(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    // localStorage can throw in a locked-down browser context (private mode, blocked storage).
    return false
  }
}

export function storeDebugColumnsPref(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    // Ignore - the value just won't survive a reload.
  }
}
