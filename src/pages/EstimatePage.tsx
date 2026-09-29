import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Info,
  LayoutDashboard,
  Loader2,
  RotateCcw,
  School,
  Send,
  Shield,
  ShoppingCart,
  Smartphone,
} from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { cn } from "@/lib/utils"
import {
  CARE_PLAN,
  DESIGN_OPTIONS,
  FEATURES,
  PROJECT_TYPES,
  TIMELINE_OPTIONS,
  type FeatureId,
  type ProjectType,
  type ProjectTypeId,
} from "@/features/estimator/pricing"
import {
  EMPTY_SELECTIONS,
  calculateEstimate,
  formatCompactTZS,
  formatTZS,
  type Estimate,
  type EstimatorSelections,
} from "@/features/estimator/calculate"

const STORAGE_KEY = "rn-estimator-v1"
const WHATSAPP_NUMBER = "255687544999"

const TYPE_ICONS: Record<ProjectType["icon"], ReactNode> = {
  globe: <Globe className="h-6 w-6" />,
  cart: <ShoppingCart className="h-6 w-6" />,
  smartphone: <Smartphone className="h-6 w-6" />,
  school: <School className="h-6 w-6" />,
  layout: <LayoutDashboard className="h-6 w-6" />,
  shield: <Shield className="h-6 w-6" />,
}

const STEPS = ["Project", "Size", "Features", "Options", "Estimate"] as const

type SavedState = { selections: EstimatorSelections; step: number }

function loadSaved(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    if (!parsed?.selections || typeof parsed.step !== "number") return null
    return parsed
  } catch {
    return null
  }
}

function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
    )
  }
}

function rangeLabel(min: number, max: number) {
  return `${formatCompactTZS(min)} – ${formatCompactTZS(max)}`
}

function weeksLabel(estimate: Estimate) {
  return estimate.weeksMin === estimate.weeksMax
    ? `${estimate.weeksMin} week${estimate.weeksMin === 1 ? "" : "s"}`
    : `${estimate.weeksMin}–${estimate.weeksMax} weeks`
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */

function OptionCard({
  selected,
  onSelect,
  role = "radio",
  children,
  className,
}: {
  selected: boolean
  onSelect: () => void
  role?: "radio" | "checkbox"
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative text-left rounded-2xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
          : "border-foreground/15 bg-card/40 hover:border-primary/50 hover:bg-card/70",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
          role === "checkbox" && "rounded-md",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
        )}
        aria-hidden="true"
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      {children}
    </button>
  )
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-bold font-poppins mb-2">{title}</h2>
      <p className="text-foreground/70">{subtitle}</p>
    </div>
  )
}

function Stepper({ step, maxReached, onJump }: { step: number; maxReached: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 md:gap-3" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        const reachable = i <= maxReached && i !== step
        return (
          <li key={label} className="flex items-center gap-2 md:gap-3 flex-1 last:flex-none">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(i)}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full transition-colors disabled:cursor-default",
                reachable && "hover:text-primary",
              )}
            >
              <span
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors flex-shrink-0",
                  current && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary bg-primary/15 text-primary",
                  !current && !done && "border-foreground/20 text-foreground/50",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("hidden md:inline text-sm font-medium", current ? "text-foreground" : "text-foreground/60")}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className={cn("h-0.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-foreground/15")} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

type ContactForm = { name: string; phone: string; email: string; company: string; notes: string; website: string }
const EMPTY_FORM: ContactForm = { name: "", phone: "", email: "", company: "", notes: "", website: "" }

export default function EstimatePage() {
  useDocumentTitle("Project Estimator")
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selections, setSelections] = useState<EstimatorSelections>(() => loadSaved()?.selections ?? EMPTY_SELECTIONS)
  const [step, setStep] = useState<number>(() => Math.min(loadSaved()?.step ?? 0, 3))
  const [maxReached, setMaxReached] = useState(step)
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)

  // Links like /estimate?type=security-audit start with that project type chosen
  const presetType = searchParams.get("type") as ProjectTypeId | null
  useEffect(() => {
    if (!presetType) return
    if (PROJECT_TYPES.some((t) => t.id === presetType)) {
      setSelections({ ...EMPTY_SELECTIONS, type: presetType })
      setReference(null)
      setMaxReached(1)
      setStep(1)
    }
    setSearchParams({}, { replace: true })
  }, [presetType, setSearchParams])

  const type = PROJECT_TYPES.find((t) => t.id === selections.type) ?? null
  const estimate = useMemo(() => calculateEstimate(selections), [selections])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ selections, step }))
    } catch {
      // Storage may be unavailable (private mode); the estimator still works
    }
  }, [selections, step])

  useEffect(() => {
    setMaxReached((m) => Math.max(m, step))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const canContinue = [Boolean(selections.type), Boolean(selections.scale), true, true, false][step]

  const goTo = (next: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, next)))

  const chooseType = (id: ProjectTypeId) => {
    setSelections((s) =>
      s.type === id ? s : { ...EMPTY_SELECTIONS, type: id, design: s.design, timeline: s.timeline },
    )
    if (selections.type !== id) setMaxReached(1)
    window.setTimeout(() => goTo(1), 180)
  }

  const chooseScale = (id: EstimatorSelections["scale"]) => {
    setSelections((s) => ({ ...s, scale: id }))
    window.setTimeout(() => goTo(2), 180)
  }

  const toggleFeature = (id: FeatureId) =>
    setSelections((s) => ({
      ...s,
      features: s.features.includes(id) ? s.features.filter((f) => f !== id) : [...s.features, id],
    }))

  const startOver = () => {
    setSelections(EMPTY_SELECTIONS)
    setForm(EMPTY_FORM)
    setReference(null)
    setMaxReached(0)
    setStep(0)
  }

  const summaryText = () => {
    if (!type || !estimate) return ""
    const scale = type.scales.find((s) => s.id === selections.scale)
    const features = selections.features.map((f) => FEATURES[f].label)
    const design = DESIGN_OPTIONS.find((d) => d.id === selections.design)
    const timeline = TIMELINE_OPTIONS.find((t) => t.id === selections.timeline)
    return [
      `Project: ${type.label}${scale ? ` (${scale.label}: ${scale.description})` : ""}`,
      features.length ? `Features: ${features.join(", ")}` : "Features: none",
      type.hasDesign && design ? `Design: ${design.label}` : null,
      timeline ? `Timeline: ${timeline.label}` : null,
      `Estimate: ${formatTZS(estimate.min)} – ${formatTZS(estimate.max)}`,
      `Duration: ${weeksLabel(estimate)}`,
    ]
      .filter(Boolean)
      .join("\n")
  }

  const whatsappHref = () => {
    const name = form.name.trim()
    const text = `Habari RynexNative${name ? `, mimi ni ${name}` : ""}. Nimetumia project estimator kwenye website yenu:\n\n${summaryText()}${
      form.notes.trim() ? `\n\nMaelezo: ${form.notes.trim()}` : ""
    }`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !estimate || isSubmitting) return
    // Honeypot: real people never fill the hidden "website" field
    if (form.website) return

    const phone = form.phone.replace(/[^\d+]/g, "")
    if (phone.length < 9) {
      toast({ variant: "destructive", title: "Check your phone number", description: "Please enter a valid phone number so we can reach you." })
      return
    }

    setIsSubmitting(true)
    const id = newId()
    try {
      const { error } = await supabase.from("project_estimates").insert({
        id,
        name: form.name.trim(),
        phone,
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        notes: form.notes.trim() || null,
        project_type: type.id,
        selections: { ...selections },
        estimate_min: estimate.min,
        estimate_max: estimate.max,
        weeks_min: estimate.weeksMin,
        weeks_max: estimate.weeksMax,
      })
      if (error) throw error
      setReference(id.slice(0, 8).toUpperCase())
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    } catch (error) {
      console.error("Error submitting estimate:", error)
      toast({
        variant: "destructive",
        title: "Could not send your request",
        description: "Please try again, or send it to us on WhatsApp instead.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------------- Step content ---------------- */

  const renderStep = () => {
    if (step === 0) {
      return (
        <>
          <StepHeading title="What do you want to build?" subtitle="Pick the option closest to your idea. You can change it later." />
          <div role="radiogroup" aria-label="Project type" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {PROJECT_TYPES.map((t) => (
              <OptionCard key={t.id} selected={selections.type === t.id} onSelect={() => chooseType(t.id)} className="pr-12">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white mb-4">
                  {TYPE_ICONS[t.icon]}
                </span>
                <span className="block font-semibold text-lg text-foreground mb-1">{t.label}</span>
                <span className="block text-sm text-foreground/65 mb-3">{t.tagline}</span>
                <span className="block text-sm font-semibold text-primary">From {formatCompactTZS(t.scales[0].min)}</span>
              </OptionCard>
            ))}
          </div>
        </>
      )
    }

    if (step === 1 && type) {
      return (
        <>
          <StepHeading title="How big is it?" subtitle={`Choose the size that best fits your ${type.label.toLowerCase()}.`} />
          <div role="radiogroup" aria-label="Project size" className="grid md:grid-cols-3 gap-4">
            {type.scales.map((s) => (
              <OptionCard key={s.id} selected={selections.scale === s.id} onSelect={() => chooseScale(s.id)} className="pr-12">
                <span className="block font-semibold text-lg text-foreground mb-1">{s.label}</span>
                <span className="block text-sm text-foreground/65 mb-4">{s.description}</span>
                <span className="block text-xl font-bold text-primary mb-1">{rangeLabel(s.min, s.max)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/60">
                  <Clock className="h-3.5 w-3.5" />
                  {s.weeks[0]}–{s.weeks[1]} weeks
                </span>
              </OptionCard>
            ))}
          </div>
        </>
      )
    }

    if (step === 2 && type) {
      return (
        <>
          <StepHeading title="Which features do you need?" subtitle="Select all that apply, or skip if you're not sure yet." />
          <div role="group" aria-label="Features" className="grid md:grid-cols-2 gap-3">
            {type.features.map((id) => {
              const f = FEATURES[id]
              const selected = selections.features.includes(id)
              return (
                <OptionCard key={id} role="checkbox" selected={selected} onSelect={() => toggleFeature(id)} className="pr-12 py-4">
                  <span className="block font-semibold text-foreground">{f.label}</span>
                  <span className="block text-sm text-foreground/65 mt-0.5 mb-2">{f.description}</span>
                  <span className="block text-xs font-semibold text-primary">+ {rangeLabel(f.min, f.max)}</span>
                </OptionCard>
              )
            })}
          </div>
        </>
      )
    }

    if (step === 3 && type) {
      return (
        <>
          <StepHeading title="Final details" subtitle="These help us fine-tune the price and schedule." />
          {type.hasDesign && (
            <fieldset className="mb-8">
              <legend className="font-semibold mb-3">Design</legend>
              <div role="radiogroup" aria-label="Design" className="grid md:grid-cols-2 gap-3">
                {DESIGN_OPTIONS.map((d) => (
                  <OptionCard
                    key={d.id}
                    selected={selections.design === d.id}
                    onSelect={() => setSelections((s) => ({ ...s, design: d.id }))}
                    className="pr-12 py-4"
                  >
                    <span className="block font-semibold text-foreground">{d.label}</span>
                    <span className="block text-sm text-foreground/65 mt-0.5">{d.description}</span>
                  </OptionCard>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="font-semibold mb-3">When do you need it?</legend>
            <div role="radiogroup" aria-label="Timeline" className="grid md:grid-cols-3 gap-3">
              {TIMELINE_OPTIONS.map((t) => (
                <OptionCard
                  key={t.id}
                  selected={selections.timeline === t.id}
                  onSelect={() => setSelections((s) => ({ ...s, timeline: t.id }))}
                  className="pr-12 py-4"
                >
                  <span className="block font-semibold text-foreground">{t.label}</span>
                  <span className="block text-sm text-foreground/65 mt-0.5">{t.description}</span>
                </OptionCard>
              ))}
            </div>
          </fieldset>
        </>
      )
    }

    if (step === 4 && type && estimate) {
      if (reference) {
        return (
          <div className="text-center py-6 md:py-10 animate-fade-in">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="h-11 w-11 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-poppins mb-3">Request received!</h2>
            <p className="text-foreground/75 max-w-md mx-auto mb-2">
              Thank you, {form.name.trim().split(" ")[0]}. We'll call you on <strong>{form.phone}</strong> within 24 hours to
              discuss your {type.label.toLowerCase()}.
            </p>
            <p className="text-sm text-foreground/60 mb-8">
              Reference: <span className="font-mono font-semibold text-primary">#{reference}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="h-11 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center hover:opacity-90">
                Back to home
              </Link>
              <button type="button" onClick={startOver} className="h-11 px-6 rounded-xl glass font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/10">
                <RotateCcw className="h-4 w-4" />
                New estimate
              </button>
            </div>
          </div>
        )
      }

      return (
        <>
          <div className="rounded-3xl p-6 md:p-8 mb-8 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/25">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Your estimate</p>
            <p className="font-bold font-poppins text-foreground mb-3 leading-tight">
              <span className="block text-sm font-semibold text-foreground/60 mb-1">TZS</span>
              <span className="text-3xl md:text-4xl whitespace-nowrap">{formatTZS(estimate.min).replace("TZS ", "")}</span>
              <span className="text-2xl md:text-3xl text-foreground/40 mx-2">–</span>
              <span className="text-3xl md:text-4xl whitespace-nowrap inline-block">{formatTZS(estimate.max).replace("TZS ", "")}</span>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-foreground/75">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {weeksLabel(estimate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Optional {CARE_PLAN.label.toLowerCase()}: {formatTZS(CARE_PLAN.monthly)}/month
              </span>
            </div>
          </div>

          <details className="group mb-8 rounded-2xl border border-foreground/10 bg-card/40" open>
            <summary className="cursor-pointer list-none flex items-center justify-between p-5 font-semibold">
              Price breakdown
              <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <ul className="px-5 pb-5 divide-y divide-foreground/10">
              {estimate.lines.map((line) => (
                <li key={line.label} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-foreground/80">{line.label}</span>
                  <span className="font-medium text-foreground whitespace-nowrap">{rangeLabel(line.min, line.max)}</span>
                </li>
              ))}
            </ul>
            <p className="px-5 pb-5 text-xs text-foreground/55">
              This is an initial estimate. We confirm the final price after a free 30-minute call about your requirements.
            </p>
          </details>

          <form onSubmit={submit} className="space-y-4" noValidate={false}>
            <h3 className="text-xl font-bold font-poppins">Get your detailed quote</h3>
            <p className="text-foreground/70 text-sm -mt-2">Free, no obligation. We'll reply within 24 hours.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Full name *</span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Phone / WhatsApp *</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder="07XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Company</span>
                <input
                  autoComplete="organization"
                  maxLength={100}
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Anything else we should know?</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Your idea, deadline, budget or questions..."
                className="w-full px-4 py-3 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </label>
            {/* Honeypot field for bots, hidden from people and screen readers */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity flex-1"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isSubmitting ? "Sending..." : "Send my request"}
              </button>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1ebe5b] transition-colors"
              >
                Send on WhatsApp
              </a>
            </div>
          </form>
        </>
      )
    }

    return null
  }

  const isFinalStep = step === STEPS.length - 1
  const nextLabel = step === 3 ? "See my estimate" : step === 2 && selections.features.length === 0 ? "Skip" : "Continue"

  return (
    <SiteLayout className={cn(!isFinalStep && "pb-20 lg:pb-0")}>
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 md:pt-14">
          <h1 className="text-3xl md:text-5xl font-bold font-poppins text-white mb-3">
            Estimate your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">project</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl">
            Get an instant price range in under 2 minutes. No sign-up, no obligation.
          </p>
          <div className="text-slate-200">
            <Stepper step={step} maxReached={reference ? step : maxReached} onJump={(i) => !reference && goTo(i)} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className={cn("grid gap-8 items-start", isFinalStep ? "max-w-3xl mx-auto" : "lg:grid-cols-[1fr,320px]")}>
          {/* Step content */}
          <div className="glass rounded-3xl p-5 md:p-8">
            <div key={`${step}-${reference ?? ""}`} className="animate-fade-in">
              {renderStep()}
            </div>

            {!isFinalStep && (
              <div className="hidden lg:flex items-center justify-between mt-8 pt-6 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={step === 0}
                  className="h-11 px-4 rounded-xl inline-flex items-center gap-2 text-foreground/80 hover:text-primary disabled:opacity-0 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  disabled={!canContinue}
                  className="h-11 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            {isFinalStep && !reference && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-foreground/10">
                <button type="button" onClick={() => goTo(3)} className="h-11 inline-flex items-center gap-2 text-foreground/80 hover:text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  Adjust options
                </button>
                <button type="button" onClick={startOver} className="h-11 inline-flex items-center gap-2 text-foreground/60 hover:text-primary text-sm">
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </button>
              </div>
            )}
          </div>

          {/* Live summary (desktop) */}
          <aside className={cn("hidden sticky top-24 glass rounded-3xl p-6", !isFinalStep && "lg:block")} aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/55 mb-2">Live estimate</p>
            {estimate ? (
              <>
                <p className="text-3xl font-bold font-poppins text-primary mb-1">{rangeLabel(estimate.min, estimate.max)}</p>
                <p className="text-sm text-foreground/60 mb-5">TZS · {weeksLabel(estimate)}</p>
              </>
            ) : (
              <p className="text-foreground/60 mb-5">Choose a project type to see a price.</p>
            )}
            {type && (
              <ul className="space-y-2.5 text-sm border-t border-foreground/10 pt-4">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    {type.label}
                    {selections.scale && ` · ${type.scales.find((s) => s.id === selections.scale)?.label}`}
                  </span>
                </li>
                {selections.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground/80">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    {FEATURES[f].label}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-xs text-foreground/50 leading-relaxed">
              Prices are estimates in Tanzanian Shillings. Final quote after a free consultation.
            </p>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      {!isFinalStep && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-foreground/10 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                aria-label="Back"
                className="h-12 w-12 flex-shrink-0 rounded-xl glass inline-flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex-1 min-w-0" aria-live="polite">
              {estimate ? (
                <>
                  <p className="text-lg font-bold text-primary leading-tight truncate">TZS {rangeLabel(estimate.min, estimate.max)}</p>
                  <p className="text-xs text-foreground/60">{weeksLabel(estimate)}</p>
                </>
              ) : (
                <p className="text-sm text-foreground/60">Select a project type</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              disabled={!canContinue}
              className="h-12 px-5 flex-shrink-0 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 disabled:opacity-40"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </SiteLayout>
  )
}
