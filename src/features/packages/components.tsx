import { Link } from "react-router-dom"
import { ArrowRight, Check, Clock, Eye, Gift, Handshake, KeyRound, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROCESS_STEPS, TRUST_PROMISES } from "./content"
import { PACKAGE_CATEGORIES, formatAmount, formatBonusEnd, type PackageCategory, type ServicePackage } from "./types"

export function PackagePrice({ pkg, size = "md" }: { pkg: ServicePackage; size?: "md" | "lg" }) {
  const big = size === "lg" ? "text-4xl" : "text-3xl"
  if (pkg.price === null) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-foreground/50 mb-1">Investment</p>
        <p className={cn("font-bold font-poppins leading-tight", size === "lg" ? "text-3xl" : "text-2xl")}>Tailored to you</p>
        <p className="text-sm text-foreground/60 mt-1">Priced after a free strategy conversation</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-foreground/50 mb-1">{pkg.price_label || "Investment"}</p>
      <p className={cn("font-bold font-poppins leading-tight", big)}>{formatAmount(pkg.price)}</p>
      {pkg.price_note && <p className="text-sm text-foreground/60 mt-1">{pkg.price_note}</p>}
    </div>
  )
}

export function BonusNote({ pkg, className }: { pkg: ServicePackage; className?: string }) {
  if (!pkg.bonus) return null
  return (
    <p className={cn("flex items-start gap-2 rounded-xl bg-accent/10 border border-accent/25 px-3 py-2.5 text-sm", className)}>
      <Gift className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
      <span>
        <strong className="font-semibold">Included{pkg.bonus_ends_at ? ` until ${formatBonusEnd(pkg.bonus_ends_at)}` : ""}:</strong> {pkg.bonus}
      </span>
    </p>
  )
}

export function PackageCard({ pkg }: { pkg: ServicePackage }) {
  const featured = pkg.is_featured
  return (
    <article
      className={cn(
        "relative glass rounded-3xl p-6 md:p-7 flex flex-col h-full transition-all",
        featured ? "border-primary/50 shadow-2xl shadow-primary/15 lg:-translate-y-2" : "hover:border-primary/30",
      )}
    >
      {pkg.badge && (
        <span
          className={cn(
            "absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold shadow-lg",
            featured ? "bg-gradient-primary text-white" : "bg-background border border-foreground/15 text-foreground",
          )}
        >
          {pkg.badge}
        </span>
      )}
      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{pkg.tier || PACKAGE_CATEGORIES[pkg.category]}</p>
      <h3 className="text-2xl font-bold font-poppins mb-2">{pkg.name}</h3>
      {pkg.audience && <p className="text-sm text-foreground/65 mb-5">{pkg.audience}</p>}

      <div className="pb-5 mb-5 border-b border-foreground/10">
        <PackagePrice pkg={pkg} />
      </div>

      {pkg.features.length > 0 && (
        <ul className="space-y-2.5 mb-6">
          {pkg.features.slice(0, 6).map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
          {pkg.features.length > 6 && <li className="text-sm text-foreground/50 pl-6">+ {pkg.features.length - 6} more</li>}
        </ul>
      )}

      <div className="mt-auto space-y-4">
        {(pkg.delivery_time || pkg.support) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground/65">
            {pkg.delivery_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {pkg.delivery_time}
              </span>
            )}
            {pkg.support && (
              <span className="inline-flex items-center gap-1.5">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                {pkg.support}
              </span>
            )}
          </div>
        )}
        <BonusNote pkg={pkg} />
        <Link
          to={`/packages/${pkg.slug}`}
          className={cn(
            "w-full h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all group",
            featured ? "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary/20" : "glass hover:bg-primary/10 hover:text-primary",
          )}
        >
          {pkg.price === null ? "Start the conversation" : `Choose ${pkg.tier || pkg.name}`}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  )
}

export function PackageCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-7 animate-pulse space-y-4" aria-hidden="true">
      <div className="h-3 w-20 bg-foreground/10 rounded" />
      <div className="h-7 w-3/4 bg-foreground/10 rounded" />
      <div className="h-4 w-full bg-foreground/10 rounded" />
      <div className="h-10 w-1/2 bg-foreground/10 rounded" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-3 w-5/6 bg-foreground/10 rounded" />
      ))}
      <div className="h-12 w-full bg-foreground/10 rounded-xl" />
    </div>
  )
}

export function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: PackageCategory[]
  value: PackageCategory
  onChange: (category: PackageCategory) => void
}) {
  if (categories.length < 2) return null
  return (
    <div role="tablist" aria-label="Service" className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={value === c}
          onClick={() => onChange(c)}
          className={cn(
            "px-5 h-10 rounded-full text-sm font-medium border whitespace-nowrap transition-colors",
            value === c ? "bg-primary text-primary-foreground border-primary" : "border-foreground/15 text-foreground/75 hover:border-primary/50 hover:text-primary",
          )}
        >
          {PACKAGE_CATEGORIES[c]}
        </button>
      ))}
    </div>
  )
}

const TRUST_ICONS = {
  handshake: Handshake,
  eye: Eye,
  key: KeyRound,
  shield: ShieldCheck,
  lifebuoy: LifeBuoy,
  sparkles: Sparkles,
}

export function TrustPromises({ compact = false }: { compact?: boolean }) {
  const items = compact ? TRUST_PROMISES.slice(0, 3) : TRUST_PROMISES
  return (
    <ul className={cn("grid gap-4", compact ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {items.map((item) => {
        const Icon = TRUST_ICONS[item.icon]
        return (
          <li key={item.title} className="glass rounded-2xl p-5 flex gap-4">
            <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold mb-1">{item.title}</span>
              <span className="block text-sm text-foreground/70 leading-relaxed">{item.text}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function ProcessSteps({ narrow = false }: { narrow?: boolean }) {
  return (
    <ol className={cn("grid sm:grid-cols-2 gap-4", !narrow && "lg:grid-cols-4")}>
      {PROCESS_STEPS.map((step, i) => (
        <li key={step.title} className="relative glass rounded-2xl p-5">
          <span className="h-9 w-9 rounded-full bg-gradient-primary text-white font-bold flex items-center justify-center mb-3">{i + 1}</span>
          <p className="font-semibold mb-1">{step.title}</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{step.text}</p>
        </li>
      ))}
    </ol>
  )
}
