import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { trackPageView } from "@/lib/track"

/** Starts every new page at the top, unless a section scroll was requested. */
export function ScrollToTop() {
  const { pathname, state } = useLocation()
  const hasSectionTarget = Boolean((state as { scrollTo?: string } | null)?.scrollTo)

  useEffect(() => {
    if (!hasSectionTarget) window.scrollTo(0, 0)
    // Only react to page changes, not to state being cleared afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}

/** Counts page views (daily totals only, see lib/track). */
export function PageViewTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])
  return null
}
