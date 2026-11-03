import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Pill } from "@/features/dashboard/ui"
import { cn } from "@/lib/utils"
import { BATCH_STATUS, num, type BatchFigures, type BatchStatus } from "./types"

export const FARM = "/admin/chicken-point"

/** One headline number. `tone` colours the number only for good/bad money. */
export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "bad"; icon?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={cn("text-2xl font-bold font-poppins mt-1 tabular-nums", tone === "good" && "text-emerald-600 dark:text-emerald-400", tone === "bad" && "text-red-600 dark:text-red-400")}>
        {value}
      </p>
      {sub && <p className="text-xs text-foreground/55 mt-0.5">{sub}</p>}
    </div>
  )
}

/** Age against the target age, and birds alive. */
export function BatchCard({
  id,
  code,
  house,
  breed,
  status,
  chicks_count,
  figures,
}: {
  id: number
  code: string
  house: string
  breed: string
  status: BatchStatus
  chicks_count: number
  figures: BatchFigures
}) {
  const target = figures.age_days + figures.days_to_target
  const progress = Math.min(100, Math.round((figures.age_days / Math.max(target, 1)) * 100))
  const late = figures.days_to_target < 0 && status !== "closed"
  return (
    <Link to={`${FARM}/batches/${id}`} className="block glass rounded-2xl p-4 hover:border-amber-500/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold font-poppins">{code}</p>
          <p className="text-xs text-foreground/55 truncate">{[house, breed].filter(Boolean).join(" · ") || `${num(chicks_count)} chicks`}</p>
        </div>
        <Pill className={BATCH_STATUS[status].className}>{BATCH_STATUS[status].label}</Pill>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold font-poppins tabular-nums">{num(figures.alive)}</p>
          <p className="text-xs text-foreground/55">alive of {num(chicks_count)}</p>
        </div>
        <div className="text-right text-xs text-foreground/60 space-y-0.5">
          <p>
            <span className={cn("font-semibold", figures.mortality_pct >= 5 ? "text-red-600" : "text-foreground/80")}>{figures.deaths}</span> died ({figures.mortality_pct}%)
          </p>
          <p>
            <span className="font-semibold text-foreground/80">{num(figures.sold)}</span> sold
          </p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-foreground/55 mb-1">
          <span>Day {figures.age_days}</span>
          <span className={cn(late && "text-red-600 font-semibold")}>
            {status === "closed" ? "Closed" : late ? `${-figures.days_to_target} days past target` : `${figures.days_to_target} days to target`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Age">
          <div className={cn("h-full rounded-full", late ? "bg-red-500" : "bg-amber-500")} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Link>
  )
}

/** Horizontal bars for one measure (e.g. costs by kind), largest first. */
export function Bars({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${format(row.value)} (${total ? Math.round((row.value * 100) / total) : 0}%)`}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <span className="truncate">{row.label}</span>
            <span className="tabular-nums text-foreground/70 whitespace-nowrap">{format(row.value)}</span>
          </div>
          <div className="h-2 rounded-r bg-foreground/[0.06]">
            <div className="h-full rounded-r bg-amber-500" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
