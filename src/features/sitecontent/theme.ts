import { useEffect, useSyncExternalStore } from "react"
import { useHeroContent } from "./api"
import type { HeroTheme } from "./types"

export type Look = "light" | "dark"

/**
 * Light or dark, for the navigation bar and the hero. In order:
 *   1. what this visitor picked with the sun/moon button (kept in their browser),
 *   2. what the site owner chose in Dashboard -> Hero section,
 *   3. "auto": the visitor's phone or computer setting.
 */
const OWN_KEY = "rn:theme"
// The owner's choice from the last visit, so a returning visitor doesn't see the page flip once it loads
const SITE_KEY = "rn:site-theme"
const DEVICE_DARK = "(prefers-color-scheme: dark)"

function read(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the choice lasts until the page is closed
  }
}

const isLook = (value: unknown): value is Look => value === "light" || value === "dark"
const isTheme = (value: unknown): value is HeroTheme => isLook(value) || value === "auto"

let own: Look | null = typeof window === "undefined" ? null : (read(OWN_KEY) as Look | null)
if (!isLook(own)) own = null
const listeners = new Set<() => void>()

/** The sun/moon button: remembered in this browser only */
export function chooseLook(look: Look) {
  own = look
  write(OWN_KEY, look)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const device = window.matchMedia(DEVICE_DARK)
  device.addEventListener("change", listener)
  return () => {
    listeners.delete(listener)
    device.removeEventListener("change", listener)
  }
}

export function useLook(): Look {
  const { data } = useHeroContent()
  const remembered = typeof window === "undefined" ? null : read(SITE_KEY)
  const site: HeroTheme = data?.theme ?? (isTheme(remembered) ? remembered : "auto")
  useEffect(() => {
    if (data?.theme) write(SITE_KEY, data.theme)
  }, [data?.theme])

  const mine = useSyncExternalStore(subscribe, () => own, () => null)
  const deviceDark = useSyncExternalStore(subscribe, () => window.matchMedia(DEVICE_DARK).matches, () => true)
  if (mine) return mine
  if (site !== "auto") return site
  return deviceDark ? "dark" : "light"
}
