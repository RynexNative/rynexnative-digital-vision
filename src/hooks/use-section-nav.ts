import { useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

type SectionState = { scrollTo?: string } | null

/**
 * Scrolls smoothly to a home page section. Sections above it may load their
 * content while we scroll past and push it down, so for a moment we follow
 * any change in page height and land on the section again.
 */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: "smooth" })
  if (!("ResizeObserver" in window)) return
  let settle = 0
  const observer = new ResizeObserver(() => {
    window.clearTimeout(settle)
    settle = window.setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 150)
  })
  observer.observe(document.body)
  window.setTimeout(() => observer.disconnect(), 2500)
}

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
        scrollToSection(id)
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
      scrollToSection(target)
      navigate(".", { replace: true, state: null })
    })
    return () => cancelAnimationFrame(frame)
  }, [target, navigate])
}
