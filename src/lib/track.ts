import { API_URL } from "./api"

/*
 * Privacy-friendly visit counting: no cookies, no IDs, nothing that follows a person.
 * The server only keeps daily totals per page and per source (Google, WhatsApp...).
 * sessionStorage remembers, for this tab only, where the visit started so forms can
 * say which source and page led to a request.
 */

const VISIT_KEY = "rn:visit"
const NO_TRACK_KEY = "rn:no-track"

type Visit = { referrer: string; utm_source: string; landing_page: string }

function storage(kind: "session" | "local"): Storage | null {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function readVisit(): Visit | null {
  try {
    const raw = storage("session")?.getItem(VISIT_KEY)
    return raw ? (JSON.parse(raw) as Visit) : null
  } catch {
    return null
  }
}

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true || storage("local")?.getItem(NO_TRACK_KEY) === "1"
}

/** The team's own browsing should not count. Called when someone signs in to the dashboard. */
export function excludeThisBrowser() {
  try {
    storage("local")?.setItem(NO_TRACK_KEY, "1")
  } catch {
    // Storage blocked: nothing to remember
  }
}

/** Counts one page view. The first view in a tab also records where the visit came from. */
export function trackPageView(path: string) {
  if (path.startsWith("/admin") || optedOut()) return
  let visit = readVisit()
  const newVisit = !visit
  if (!visit) {
    const params = new URLSearchParams(window.location.search)
    visit = { referrer: document.referrer, utm_source: params.get("utm_source") ?? params.get("ref") ?? "", landing_page: path }
    try {
      storage("session")?.setItem(VISIT_KEY, JSON.stringify(visit))
    } catch {
      // Without storage every page looks like a new visit's first page; still fine for totals
    }
  }
  const body = JSON.stringify({ path, new_visit: newVisit, ...(newVisit ? { referrer: visit.referrer, utm_source: visit.utm_source } : {}) })
  // text/plain needs no CORS preflight; keepalive lets the request finish if the page is closing
  fetch(`${API_URL}/api/track/`, { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: true, credentials: "omit" }).catch(() => {})
}

/** Sent with forms so a request can be traced back to its source and landing page. */
export function attribution(): Visit | undefined {
  return readVisit() ?? undefined
}
