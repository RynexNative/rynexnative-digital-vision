import type { ReactNode } from "react"
import { AlertTriangle, Inbox, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-poppins">{title}</h1>
        {subtitle && <p className="text-foreground/60 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap", className)}>
      {children}
    </span>
  )
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: NoInfer<T>) => void
  options: { id: NoInfer<T>; label: string }[]
}) {
  return (
    <div role="tablist" className="flex gap-1 p-1 rounded-xl bg-card/60 border border-foreground/10 overflow-x-auto">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "px-3.5 h-9 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            value === option.id ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-0 sm:max-w-xs">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-11 pl-10 pr-3 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
      />
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="glass rounded-2xl p-5 animate-pulse">
          <div className="h-4 w-1/3 bg-foreground/10 rounded mb-3" />
          <div className="h-3 w-2/3 bg-foreground/10 rounded mb-2" />
          <div className="h-3 w-1/2 bg-foreground/10 rounded" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <Inbox className="h-10 w-10 text-foreground/30 mx-auto mb-3" />
      <p className="font-semibold">{title}</p>
      {text && <p className="text-sm text-foreground/60 mt-1">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass rounded-2xl p-8 text-center border-red-500/20">
      <AlertTriangle className="h-9 w-9 text-red-500 mx-auto mb-3" />
      <p className="font-semibold">Imeshindikana kupakia data</p>
      <p className="text-sm text-foreground/60 mt-1">Angalia internet yako kisha ujaribu tena.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 h-10 px-4 rounded-xl glass inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
      >
        <RefreshCw className="h-4 w-4" />
        Jaribu tena
      </button>
    </div>
  )
}
