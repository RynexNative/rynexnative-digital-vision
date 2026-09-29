import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Link2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SEVERITY_META, alertUrl, formatAlertDate, type AlertSeverity, type SecurityAlert } from "./types"

export function SeverityBadge({ severity, className }: { severity: AlertSeverity; className?: string }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.medium
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName, severity === "high" && "animate-pulse")} />
      {meta.label}
    </span>
  )
}

export function AlertCard({ alert, featured = false }: { alert: SecurityAlert; featured?: boolean }) {
  return (
    <Link
      to={`/tahadhari/${alert.slug}`}
      className={cn(
        "group glass rounded-3xl p-6 flex flex-col hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        featured && "md:p-8 border-red-500/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs font-medium text-foreground/60">{alert.category}</span>
      </div>
      <h3
        className={cn(
          "font-bold font-poppins text-foreground group-hover:text-primary transition-colors mb-3",
          featured ? "text-2xl md:text-3xl" : "text-lg",
        )}
      >
        {alert.title}
      </h3>
      <p className={cn("text-foreground/75 leading-relaxed mb-5", featured ? "text-base md:text-lg" : "text-sm line-clamp-3")}>
        {alert.summary}
      </p>
      <div className="mt-auto flex items-center justify-between text-sm">
        <time dateTime={alert.published_at ?? undefined} className="text-foreground/50">
          {formatAlertDate(alert.published_at)}
        </time>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          Soma zaidi
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  )
}

export function AlertCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 animate-pulse" aria-hidden="true">
      <div className="h-6 w-32 rounded-full bg-foreground/10 mb-4" />
      <div className="h-5 w-4/5 rounded bg-foreground/10 mb-2" />
      <div className="h-5 w-3/5 rounded bg-foreground/10 mb-5" />
      <div className="h-3 w-full rounded bg-foreground/10 mb-2" />
      <div className="h-3 w-5/6 rounded bg-foreground/10" />
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.44-9.43 9.44m8.03-17.47A11.27 11.27 0 0 0 12.05.7C5.8.7.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.33 11.33 0 0 0 5.43 1.38h.01c6.26 0 11.35-5.09 11.36-11.35a11.3 11.3 0 0 0-3.33-8.03" />
    </svg>
  )
}

function whatsappShareText(alert: SecurityAlert) {
  return `⚠️ *TAHADHARI: ${alert.title}*\n\n${alert.summary}\n\nSoma dalili na jinsi ya kujikinga:\n${alertUrl(alert.slug)}`
}

export function ShareBar({ alert, className }: { alert: SecurityAlert; className?: string }) {
  const [copied, setCopied] = useState(false)
  const url = alertUrl(alert.slug)
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Nakili link hii:", url)
    }
  }

  const nativeShare = () => {
    navigator.share({ title: alert.title, text: alert.summary, url }).catch(() => {
      // The user closed the share sheet; nothing to do
    })
  }

  const buttonClass =
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(whatsappShareText(alert))}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonClass, "bg-[#25D366] text-white hover:bg-[#1ebe5b] flex-1 sm:flex-none")}
      >
        <WhatsAppIcon className="h-5 w-5" />
        Share WhatsApp
      </a>
      <button type="button" onClick={copyLink} className={cn(buttonClass, "glass hover:bg-primary/10 text-foreground")}>
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
        <span aria-live="polite">{copied ? "Imenakiliwa!" : "Nakili link"}</span>
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={cn(buttonClass, "glass hover:bg-primary/10 text-foreground")}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}
    </div>
  )
}
