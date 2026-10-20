import { useEffect, useRef, useState } from "react"

/**
 * True once the element comes within `margin` of the viewport, and stays true.
 * Home page sections use it to fetch their data only when the visitor scrolls
 * towards them, keeping those requests off the critical path of the first paint.
 */
export function useNearViewport<T extends Element>(margin = "600px") {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (near || !element) return
    if (!("IntersectionObserver" in window)) {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: margin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [near, margin])

  return [ref, near] as const
}
