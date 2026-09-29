import { useEffect } from "react"
import { useLocation } from "react-router-dom"

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
