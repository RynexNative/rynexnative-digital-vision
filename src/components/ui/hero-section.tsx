import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Building2, GraduationCap, HeartPulse, Landmark, MapPin, ShoppingCart, Smartphone } from "lucide-react"
import { useSectionNav } from "@/hooks/use-section-nav"
import { useTrackRecord } from "@/features/projects/api"
import { useHeroContent } from "@/features/sitecontent/api"
import { useLook } from "@/features/sitecontent/theme"
import { HERO_DEFAULTS, type HeroContent } from "@/features/sitecontent/types"
import portrait1300 from "@/assets/hero-portrait-1300.webp"
import portrait720 from "@/assets/hero-portrait-720.webp"
import logoMark from "@/assets/hero-mark.webp"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const stack = ["React Native", "Flutter", "Node.js", "Django", "Laravel", "PostgreSQL", "FastAPI", "Docker", "AWS", "TensorFlow", "OpenAI", "React"]

/** The systems we build, circling the portrait */
const ORBIT = [
  { label: "School systems", icon: GraduationCap },
  { label: "Hospital systems", icon: HeartPulse },
  { label: "SACCOS & banking", icon: Landmark },
  { label: "POS & retail", icon: ShoppingCart },
  { label: "E-government", icon: Building2 },
  { label: "Mobile apps", icon: Smartphone },
]

/** What RynexAI "says" inside the systems we build (examples, in Kiswahili and English) */
const AI_LINES = [
  "Wanafunzi 1,240 wamesajiliwa leo",
  "Mauzo ya leo yamefika TZS 2.4M",
  "Wagonjwa 86 wamehudumiwa leo",
  "Mikopo 12 imeidhinishwa leo",
  "Stock low: 3 items to reorder",
]

/** Floating cards and orbit chips: white glass on the light page, dark glass on the dark one */
const CARD = "border border-emerald-950/[0.06] bg-white/90 shadow-emerald-950/10 dark:border-white/10 dark:bg-[#0d2326]/90"

const TRUST_ICONS = [GraduationCap, HeartPulse, Landmark, Building2, ShoppingCart]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const change = () => setReduced(query.matches)
    query.addEventListener("change", change)
    return () => query.removeEventListener("change", change)
  }, [])
  return reduced
}

/** "We build **websites**" -> We build <strong>websites</strong> */
function withBold(text: string) {
  return text.split("**").map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong> : <Fragment key={i}>{part}</Fragment>))
}

/** "Built for schools" -> "Built for SACCOS & banks" -> ... */
function RotatingWord({ words, reduced }: { words: string[]; reduced: boolean }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (words.length < 2) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % words.length), reduced ? 4000 : 2400)
    return () => window.clearInterval(timer)
  }, [words.length, reduced])
  const word = words[index % words.length] ?? ""
  return (
    <span key={word} className={cn("inline-block text-emerald-600 dark:text-emerald-400 whitespace-nowrap", !reduced && "animate-word-in")}>
      {word}
    </span>
  )
}

/** The assistant card: a "speaking" bar and a message that types itself */
function AiCard({ compact, reduced }: { compact?: boolean; reduced: boolean }) {
  const [line, setLine] = useState(0)
  const [shown, setShown] = useState(reduced ? AI_LINES[0].length : 0)
  useEffect(() => {
    if (compact) return
    const text = AI_LINES[line]
    if (reduced) {
      setShown(text.length)
      const timer = window.setTimeout(() => setLine((l) => (l + 1) % AI_LINES.length), 4000)
      return () => window.clearTimeout(timer)
    }
    const done = shown >= text.length
    const timer = window.setTimeout(
      () => {
        if (done) {
          setShown(0)
          setLine((l) => (l + 1) % AI_LINES.length)
        } else setShown((s) => s + 1)
      },
      done ? 2600 : 45,
    )
    return () => window.clearTimeout(timer)
  }, [shown, line, compact, reduced])

  const bars = (
    <span className="flex items-center gap-[3px] h-4" aria-hidden="true">
      {[0.15, 0.45, 0, 0.3, 0.6].map((delay, i) => (
        <span key={i} className={cn("w-[3px] h-full rounded-full bg-emerald-500 dark:bg-emerald-400 origin-center", !reduced && "animate-voice")} style={{ animationDelay: `${delay}s` }} />
      ))}
    </span>
  )
  const avatar = (
    <span className="relative h-8 w-8 flex-shrink-0 rounded-full bg-[conic-gradient(from_180deg,#10b981,#2dd4bf,#0f766e,#10b981)] p-[3px]" aria-hidden="true">
      <span className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-[#0b1f22]">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      </span>
    </span>
  )
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 rounded-full backdrop-blur px-2.5 py-1.5", CARD, "shadow-lg dark:shadow-black/30")}>
        {avatar}
        <span className="text-xs font-semibold text-slate-900 dark:text-white">RynexAI</span>
        {bars}
      </div>
    )
  }
  return (
    <div className={cn("w-[230px] rounded-2xl backdrop-blur p-3", CARD, "shadow-xl dark:shadow-black/40")}>
      <div className="flex items-center gap-2.5">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">RynexAI</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">AI inside every system</p>
        </div>
        {bars}
      </div>
      <p className="mt-2.5 h-8 rounded-lg bg-slate-100/80 text-slate-700 dark:bg-white/5 px-2.5 flex items-center text-[11px] dark:text-slate-200 whitespace-nowrap overflow-hidden" aria-live="off">
        {AI_LINES[line].slice(0, shown)}
        {!reduced && <span className="ml-0.5 inline-block w-[2px] h-3 bg-emerald-500 dark:bg-emerald-400 animate-pulse" aria-hidden="true" />}
      </p>
    </div>
  )
}

function UptimeCard({ value, label, reduced }: { value: string; label: string; reduced: boolean }) {
  return (
    <div className={cn("w-[190px] rounded-2xl backdrop-blur p-3", CARD, "shadow-xl dark:shadow-black/40")}>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="relative flex h-2 w-2">
          {!reduced && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live · secured
      </p>
      <p className="mt-1 text-2xl font-bold font-poppins text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      <svg viewBox="0 0 160 36" className="mt-2 w-full h-8" aria-hidden="true">
        <path
          d="M2 28 L18 24 L30 27 L44 18 L58 22 L72 14 L86 19 L100 11 L114 16 L128 8 L142 12 L158 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="220"
          className={cn("text-emerald-600 dark:text-emerald-400", !reduced && "animate-draw-line")}
        />
      </svg>
    </div>
  )
}

/**
 * The systems we build, circling the portrait on a tilted ellipse: chips behind the
 * person are smaller and dimmer, chips in front pass over her. Positions are set straight
 * on the elements each frame (no re-render), and the loop sleeps while off screen.
 */
function OrbitChips({ reduced, compact }: { reduced: boolean; compact?: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const chips = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    const box = stage.current
    if (!box) return
    let frame = 0
    let running = false
    const turn = compact ? 32000 : 40000 // one full circle, in ms
    const place = (time: number) => {
      const { width, height } = box.getBoundingClientRect()
      const rx = width * (compact ? 0.33 : 0.6)
      const ry = height * (compact ? 0.11 : 0.14)
      const base = (time / turn) * Math.PI * 2
      chips.current.forEach((chip, i) => {
        if (!chip) return
        const angle = base + (i / ORBIT.length) * Math.PI * 2
        const depth = (Math.sin(angle) + 1) / 2 // 0 behind, 1 in front
        chip.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * rx}px, ${Math.sin(angle) * ry}px) scale(${0.8 + depth * 0.25})`
        chip.style.opacity = String(0.45 + depth * 0.55)
        chip.style.zIndex = depth > 0.5 ? "30" : "5"
      })
    }
    const tick = (time: number) => {
      place(time)
      if (running) frame = requestAnimationFrame(tick)
    }
    if (reduced) {
      place(9000)
      return
    }
    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true
        frame = requestAnimationFrame(tick)
      } else if (!entry.isIntersecting) {
        running = false
        cancelAnimationFrame(frame)
      }
    })
    watcher.observe(box)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      watcher.disconnect()
    }
  }, [reduced, compact])

  return (
    // No transform or z-index on this layer: either would make it its own stacking context,
    // and then no chip could come in front of the photo (z-10) as it swings round.
    <div ref={stage} className={cn("absolute inset-x-0 h-[46%] pointer-events-none", compact ? "top-[43%]" : "top-[41%]")} aria-hidden="true">
      {ORBIT.map(({ label, icon: Icon }, i) => (
        <div
          key={label}
          ref={(el) => (chips.current[i] = el)}
          className={cn(
            "absolute left-1/2 top-1/2 flex items-center gap-2 whitespace-nowrap rounded-xl backdrop-blur shadow-lg dark:shadow-black/30 will-change-transform",
            CARD,
            compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
          )}
        >
          <span className={cn("flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", compact ? "h-5 w-5" : "h-6 w-6")}>
            <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        </div>
      ))}
    </div>
  )
}

/** The portrait in its glowing ring, with the orbit, the assistant and (on wide screens) the uptime card */
function PortraitStage({ content, reduced, compact }: { content: HeroContent; reduced: boolean; compact?: boolean }) {
  return (
    <div className={cn("relative mx-auto w-full", compact ? "h-[clamp(250px,44svh,370px)] max-w-[380px]" : "h-[600px] xl:h-[650px] max-w-[580px]")}>
      {/* Glow and rings behind the person */}
      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 aspect-square w-[118%] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.20),rgba(16,185,129,0.06)_55%,transparent)] dark:bg-[radial-gradient(closest-side,rgba(16,185,129,0.26),rgba(16,185,129,0.07)_55%,transparent)] animate-glow-breathe" aria-hidden="true" />
      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 aspect-square w-[98%] rounded-full border border-emerald-500/20 dark:border-emerald-400/15" aria-hidden="true" />
      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 aspect-square w-[74%] rounded-full border border-emerald-500/15 dark:border-emerald-400/10" aria-hidden="true" />
      {/* The R from our logo, pressed faintly into the background behind the person. The image is
          only a shape (outline strong, inside faint); the colour and the raised edge come from CSS. */}
      <div
        className="absolute left-1/2 top-[2%] lg:-top-[4%] h-[88%] aspect-[682/760] -translate-x-[45%] [filter:drop-shadow(1px_1px_0_rgba(255,255,255,0.95))_drop-shadow(0_10px_18px_rgba(6,78,59,0.07))] dark:[filter:drop-shadow(0_0_8px_rgba(16,185,129,0.18))]"
        aria-hidden="true"
      >
        <div
          className="h-full w-full bg-[linear-gradient(160deg,rgba(6,95,70,0.16),rgba(16,185,129,0.07))] dark:bg-[linear-gradient(160deg,rgba(52,211,153,0.16),rgba(52,211,153,0.05))]"
          style={{ maskImage: `url(${logoMark})`, WebkitMaskImage: `url(${logoMark})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }}
        />
      </div>
      {!compact &&
        [
          ["left-[14%] top-[34%]", "0s"],
          ["right-[6%] top-[46%]", "1.2s"],
          ["left-[48%] top-[6%]", "2.1s"],
          ["right-[22%] top-[3%]", "3s"],
        ].map(([where, delay]) => (
          <span key={where} className={cn("absolute h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_12px_#34d399]", where, !reduced && "animate-drift-dot")} style={{ animationDelay: delay }} aria-hidden="true" />
        ))}

      {/* An uploaded photo replaces the approved portrait that ships with the site */}
      <img
        src={content.photo ? imageUrl(content.photo, compact ? 520 : 900) : compact ? portrait720 : portrait1300}
        srcSet={content.photo ? undefined : `${portrait720} 336w, ${portrait1300} 606w`}
        sizes={content.photo ? undefined : compact ? "180px" : "330px"}
        alt={content.photo_alt}
        className={cn(
          "absolute bottom-0 left-1/2 z-10 h-[94%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom",
          compact && "[mask-image:linear-gradient(to_bottom,black_80%,transparent)]",
        )}
        fetchPriority="high"
        decoding="async"
      />

      <OrbitChips reduced={reduced} compact={compact} />

      {compact ? (
        <div className="absolute right-0 top-[6%] z-40">
          <AiCard compact reduced={reduced} />
        </div>
      ) : (
        <>
          <div className="absolute left-0 top-[10%] z-40">
            <AiCard reduced={reduced} />
          </div>
          {content.show_uptime && content.uptime_value && (
            <div className="absolute right-0 top-[19%] z-40">
              <UptimeCard value={content.uptime_value} label={content.uptime_label} reduced={reduced} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TrustIcons() {
  return (
    <span className="flex -space-x-1.5" aria-hidden="true">
      {TRUST_ICONS.map((Icon, i) => (
        <span
          key={i}
          className={cn(
            "h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#081a1d] dark:bg-emerald-400 dark:text-[#0b1f22] flex items-center justify-center",
            i === 3 ? "bg-emerald-300 text-emerald-950" : i % 2 ? "bg-emerald-600 text-white" : "bg-emerald-800 text-white",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      ))}
    </span>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-300 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em]">
      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </p>
  )
}

export function HeroSection() {
  const goToSection = useSectionNav()
  const reduced = useReducedMotion()
  const dark = useLook() === "dark"
  const { data } = useHeroContent()
  const content = data ?? HERO_DEFAULTS
  // Real totals from our client records (rounded down by the server); never a made-up number
  const { data: record } = useTrackRecord()
  const total = (key: string) => record?.totals.find((t) => t.key === key)?.display
  const organisations = total("clients")
  const projects = total("projects")

  return (
    // Light first; with a "dark" class on the section every dark: class below takes over
    <section
      className={cn(
        "relative flex min-h-[100svh] flex-col overflow-hidden",
        dark ? "dark surface-dark !bg-[#061219] ![background-image:none]" : "bg-[linear-gradient(180deg,#e2f4ec_0%,#eef8f3_45%,#f6faf8_100%)] text-slate-900",
      )}
    >
      {/* Soft green lights and a faint grid: mint on a pale page, or deep green-teal */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_38%_55%_at_72%_50%,rgba(16,185,129,0.13),transparent),radial-gradient(ellipse_45%_40%_at_0%_0%,rgba(16,185,129,0.12),transparent)] dark:bg-[radial-gradient(ellipse_38%_55%_at_72%_52%,rgba(16,185,129,0.14),transparent),radial-gradient(ellipse_50%_40%_at_15%_0%,rgba(45,212,191,0.07),transparent)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05] [background-image:linear-gradient(rgba(6,95,70,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(6,95,70,0.6)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_45%_55%_at_72%_45%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 lg:pt-24 lg:pb-0 grid items-center gap-5 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:self-stretch">
          {/* Words */}
          <div className="animate-slide-up lg:pb-10">
            <div className="hidden sm:block mb-6">
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </div>
            <div className="sm:hidden mb-4">
              <Eyebrow>{content.eyebrow_mobile}</Eyebrow>
            </div>
            <h1 className="font-poppins font-bold leading-[1.1] text-[26px] min-[375px]:text-[29px] min-[400px]:text-[31px] sm:text-5xl lg:text-[44px] xl:text-[54px] tracking-tight">
              <span className="text-slate-900 dark:text-white">{content.title}</span>
              <br />
              {/* Light: mint into deep green, as in the design. Dark: plain emerald */}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-700 bg-clip-text text-transparent dark:bg-none dark:text-emerald-400 min-[375px]:whitespace-nowrap">
                {content.highlight}
              </span>
            </h1>
            <p className="hidden sm:block mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{withBold(content.subtitle)}</p>
            <p className="sm:hidden mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{content.subtitle_mobile}</p>
            <p className="mt-3 sm:mt-5 text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
              Built for <RotatingWord words={content.audiences.length ? content.audiences : HERO_DEFAULTS.audiences} reduced={reduced} />
            </p>

            <div className="hidden lg:flex mt-8 flex-wrap items-center gap-3">
              <Link
                to="/estimate"
                className="h-14 px-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/30 transition-colors group"
              >
                Get a free estimate
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => goToSection("portfolio")}
                className="h-14 px-7 rounded-full border border-slate-300 bg-white/70 text-slate-900 hover:bg-white dark:border-white/25 dark:bg-transparent dark:text-white font-semibold dark:hover:bg-white/10 transition-colors"
              >
                See our work
              </button>
            </div>
            <div className="hidden lg:flex mt-8 items-center gap-3">
              <TrustIcons />
              <p className="text-sm leading-snug">
                {organisations && (
                  <>
                    <span className="font-semibold text-slate-900 dark:text-white">{organisations} organisations</span>
                    {projects && <span className="text-slate-500 dark:text-slate-400"> · {projects} projects delivered</span>}
                    <br />
                  </>
                )}
                <span className="text-slate-500 dark:text-slate-400">{content.trust_line}</span>
              </p>
            </div>
          </div>

          {/* Portrait */}
          <div className="hidden lg:block self-end">
            <PortraitStage content={content} reduced={reduced} />
          </div>
          <div className="lg:hidden">
            <PortraitStage content={content} reduced={reduced} compact />
          </div>

          {/* Phones and tablets: the call to action under the portrait */}
          <div className="lg:hidden">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/estimate"
                className="h-14 sm:flex-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/30 transition-colors"
              >
                Get a free estimate
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => goToSection("portfolio")}
                className="hidden sm:inline-flex h-14 sm:flex-1 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-slate-900 hover:bg-white dark:border-white/25 dark:bg-transparent dark:text-white font-semibold dark:hover:bg-white/10 transition-colors"
              >
                See our work
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <TrustIcons />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {organisations ? (
                  <>
                    <span className="font-semibold text-slate-900 dark:text-white">{organisations}</span> organisations trust us
                  </>
                ) : (
                  content.trust_line
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technologies strip */}
      <div className="relative z-10 border-t border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-black/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center gap-6 overflow-hidden">
          <p className="flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-tight border-r border-slate-200 dark:border-white/15 pr-6">
            Built
            <br />
            with
          </p>
          <div className="flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-10 w-max animate-marquee">
              {[...stack, ...stack].map((name, i) => (
                <span key={i} className="text-base sm:text-lg font-semibold text-slate-500 dark:text-slate-400/80 whitespace-nowrap" aria-hidden={i >= stack.length}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
