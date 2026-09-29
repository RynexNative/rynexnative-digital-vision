import { useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

type SectionState = { scrollTo?: string } | null

/**
 * Scrolls to a section of the home page. From any other page it first
 * navigates home and the home page scrolls once it has rendered.
 */
export function useSectionNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (id: string) => {
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      } else {
        navigate("/", { state: { scrollTo: id } })
      }
    },
    [location.pathname, navigate],
  )
}

/** Used by the home page to finish a scroll requested from another page. */
export function usePendingSectionScroll() {
  const location = useLocation()
  const navigate = useNavigate()
  const target = (location.state as SectionState)?.scrollTo

  useEffect(() => {
    if (!target) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })
      navigate(".", { replace: true, state: null })
    })
    return () => cancelAnimationFrame(frame)
  }, [target, navigate])
}
