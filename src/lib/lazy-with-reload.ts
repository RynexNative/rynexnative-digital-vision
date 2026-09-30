import { lazy, type ComponentType } from "react"

const RELOAD_KEY = "rn-reloaded-for-new-version"

/**
 * After a deploy, the old page files are deleted. A tab opened before the deploy then
 * fails to load the next page ("Failed to fetch dynamically imported module").
 * Reloading once picks up the new version. Returns false if we already reloaded
 * moments ago, so a real network problem cannot cause a reload loop.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // Storage unavailable: still reload once
  }
  window.location.reload()
  return true
}

/** React.lazy that reloads the page once if the chunk is gone after a new deploy. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((error) => {
      // Keep showing the loader while the page reloads
      if (reloadForNewVersion()) return new Promise<never>(() => {})
      throw error
    }),
  )
}
