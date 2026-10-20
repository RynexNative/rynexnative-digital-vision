import { useEffect, useRef } from "react"

type Node = { x: number; y: number; vx: number; vy: number; r: number }

const LINK_DISTANCE = 150
const MOUSE_RADIUS = 180

/**
 * Slowly drifting points joined by thin lines, like a living network.
 * Cheap to run: it pauses when off screen or in a hidden tab, uses fewer
 * points on small screens and stays still for people who prefer less motion.
 */
export function NetworkBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let nodes: Node[] = []
    let width = 0
    let height = 0
    let frame = 0
    let visible = true
    const mouse = { x: -9999, y: -9999 }

    // Sizes come from a ResizeObserver, which reports after layout instead of forcing one
    const resize = (nextWidth: number, nextHeight: number) => {
      const widthChanged = Math.round(nextWidth) !== Math.round(width)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = nextWidth
      height = nextHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Phones change height while scrolling (address bar); keep the points then
      if (widthChanged || nodes.length === 0) {
        // About one point per 14,000 px², capped so phones stay smooth
        const count = Math.min(Math.round((width * height) / 14000), width < 640 ? 36 : 80)
        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.8,
        }))
      }
      draw()
      start()
    }

    // Lines are grouped into a few opacity levels so each level is one stroke() call
    const LEVELS = 4
    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const buckets: number[][] = Array.from({ length: LEVELS }, () => [])
      const near: boolean[] = new Array(nodes.length).fill(false)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
            const level = Math.min(LEVELS - 1, Math.floor((Math.sqrt(d2) / LINK_DISTANCE) * LEVELS))
            buckets[level].push(a.x, a.y, b.x, b.y)
          }
        }
        near[i] = Math.hypot(a.x - mouse.x, a.y - mouse.y) < MOUSE_RADIUS
      }
      ctx.lineWidth = 1
      buckets.forEach((lines, level) => {
        if (!lines.length) return
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.24 * (1 - level / LEVELS)})`
        ctx.beginPath()
        for (let k = 0; k < lines.length; k += 4) {
          ctx.moveTo(lines[k], lines[k + 1])
          ctx.lineTo(lines[k + 2], lines[k + 3])
        }
        ctx.stroke()
      })
      // Points near the pointer light up and reach out to it
      ctx.strokeStyle = "rgba(110, 231, 183, 0.25)"
      ctx.beginPath()
      nodes.forEach((n, i) => {
        if (!near[i]) return
        ctx.moveTo(n.x, n.y)
        ctx.lineTo(mouse.x, mouse.y)
      })
      ctx.stroke()
      ctx.fillStyle = "rgba(52, 211, 153, 0.7)"
      ctx.beginPath()
      nodes.forEach((n, i) => {
        if (near[i]) return
        ctx.moveTo(n.x + n.r, n.y)
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      })
      ctx.fill()
      ctx.fillStyle = "rgba(167, 243, 208, 0.95)"
      ctx.beginPath()
      nodes.forEach((n, i) => {
        if (!near[i]) return
        ctx.moveTo(n.x + n.r, n.y)
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      })
      ctx.fill()
    }

    let last = 0
    const step = (now: number) => {
      frame = requestAnimationFrame(step)
      // ~30 fps is plenty for a slow drift and halves the work
      if (now - last < 32) return
      const speed = last ? Math.min((now - last) / 16.7, 3) : 1
      last = now
      for (const n of nodes) {
        n.x += n.vx * speed
        n.y += n.vy * speed
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
      }
      draw()
    }

    const start = () => {
      if (!reduceMotion && visible && width && !document.hidden && !frame) frame = requestAnimationFrame(step)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    observer.observe(canvas)

    const onVisibility = () => (document.hidden ? stop() : start())
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const sizeObserver = new ResizeObserver(([entry]) => resize(entry.contentRect.width, entry.contentRect.height))
    sizeObserver.observe(canvas)
    document.addEventListener("visibilitychange", onVisibility)
    const section = canvas.parentElement
    section?.addEventListener("pointermove", onMove)
    section?.addEventListener("pointerleave", onLeave)

    return () => {
      stop()
      observer.disconnect()
      sizeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      section?.removeEventListener("pointermove", onMove)
      section?.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
