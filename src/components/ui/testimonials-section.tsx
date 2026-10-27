import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, CheckCircle2, Quote } from "lucide-react"
import { useTestimonials } from "@/features/sitecontent/api"
import type { Testimonial } from "@/features/sitecontent/types"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const ROTATE_MS = 9000

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c))
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function Avatar({ person, size }: { person: Testimonial; size: "sm" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm"
  return person.photo ? (
    <img src={imageUrl(person.photo, 160)} alt="" width={56} height={56} loading="lazy" className={cn(box, "rounded-full object-cover ring-2 ring-primary/50 flex-shrink-0")} />
  ) : (
    <span className={cn(box, "rounded-full bg-primary/20 text-primary font-bold font-poppins flex items-center justify-center ring-2 ring-primary/40 flex-shrink-0")} aria-hidden="true">
      {initials(person.name)}
    </span>
  )
}

const who = (t: Testimonial) => [t.role, t.organisation].filter(Boolean).join(", ")

/**
 * Client stories: one story at a time, told large, with the other voices beside it.
 * Stories move on by themselves (paused while reading: hover, focus, or reduced motion).
 */
export function TestimonialsSection() {
  const { data: stories = [] } = useTestimonials()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  // Time already spent on the current story, so pausing and resuming continues where it was
  const elapsed = useRef(0)
  const startedAt = useRef(Date.now())
  const showing = useRef(0)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
  }, [])

  const go = useCallback(
    (index: number) => {
      if (!stories.length) return
      const next = (index + stories.length) % stories.length
      showing.current = next
      setActive(next)
      elapsed.current = 0
      startedAt.current = Date.now()
    },
    [stories.length],
  )

  useEffect(() => {
    if (paused || reduced || stories.length < 2) return
    startedAt.current = Date.now()
    const timer = window.setTimeout(() => go(active + 1), Math.max(0, ROTATE_MS - elapsed.current))
    return () => {
      window.clearTimeout(timer)
      // Paused on the same story: remember how long it was shown (a new story starts from zero)
      if (showing.current === active) elapsed.current += Date.now() - startedAt.current
    }
  }, [active, paused, reduced, stories.length, go])

  if (stories.length === 0) return null
  const story = stories[Math.min(active, stories.length - 1)]

  return (
    <section id="testimonials" className="surface-dark relative py-20 md:py-28 overflow-hidden">
      <div className="absolute -top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="eyebrow">In their words</p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins text-white leading-tight">
            Stories from the people <span className="text-primary">we work for</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* The story being told */}
          <figure className="lg:col-span-8 relative" onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
            <Quote className="absolute -top-6 -left-2 h-24 w-24 text-primary/15" aria-hidden="true" />
            <div key={story.id} className="relative animate-in fade-in slide-in-from-bottom-2 duration-500" aria-live="polite">
              <p className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold font-poppins text-white leading-[1.2] mb-6">
                “<span className="bg-gradient-to-t from-primary/35 from-[0.25em] to-transparent to-[0.25em]">{story.headline}</span>”
              </p>
              <blockquote className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">{story.quote}</blockquote>
              <figcaption className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
                <span className="flex items-center gap-4">
                  <Avatar person={story} size="lg" />
                  <span>
                    <span className="block font-semibold text-white text-lg">{story.name}</span>
                    {who(story) && <span className="block text-sm text-slate-400">{who(story)}</span>}
                  </span>
                </span>
                {(story.service || story.result) && (
                  <span className="flex flex-wrap gap-2">
                    {story.service && <span className="px-3 py-1 rounded-full border border-white/15 text-slate-200 text-xs font-medium">{story.service}</span>}
                    {story.result && (
                      <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {story.result}
                      </span>
                    )}
                  </span>
                )}
              </figcaption>
            </div>

            {stories.length > 1 && (
              <div className="mt-10 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go(active - 1)}
                  aria-label="Previous story"
                  className="h-11 w-11 rounded-full border border-white/20 text-white inline-flex items-center justify-center hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(active + 1)}
                  aria-label="Next story"
                  className="h-11 w-11 rounded-full bg-primary text-white inline-flex items-center justify-center hover:opacity-90"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
                <span className="text-sm tabular-nums text-slate-400">
                  <span className="text-white font-semibold">{String(active + 1).padStart(2, "0")}</span> / {String(stories.length).padStart(2, "0")}
                </span>
              </div>
            )}
          </figure>

          {/* The other voices: pick one to read it */}
          {stories.length > 1 && (
            <ul className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-1 gap-3" aria-label="All stories">
              {stories.map((t, i) => {
                const current = i === active
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={current}
                      className={cn(
                        "relative w-full text-left rounded-2xl p-4 border transition-colors overflow-hidden",
                        current ? "bg-white/10 border-primary/50" : "border-white/10 hover:bg-white/5",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Avatar person={t} size="sm" />
                        <span className="min-w-0">
                          <span className="block font-semibold text-white truncate">{t.name}</span>
                          {t.organisation && <span className="block text-xs text-slate-400 truncate">{t.organisation}</span>}
                        </span>
                      </span>
                      <span className={cn("block mt-3 text-sm leading-snug line-clamp-2", current ? "text-slate-200" : "text-slate-400")}>“{t.headline}”</span>
                      {current && !reduced && (
                        <span className="absolute bottom-0 left-0 h-0.5 bg-primary" style={{ animation: `rn-story ${ROTATE_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-14 md:mt-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-8">
          <p className="text-lg text-slate-300">Your project could be the next story we are proud to tell.</p>
          <Link to="/packages" className="h-12 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90">
            Start your project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <style>{"@keyframes rn-story { from { width: 0 } to { width: 100% } }"}</style>
    </section>
  )
}
