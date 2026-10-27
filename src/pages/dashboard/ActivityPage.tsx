import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronDown, Globe, Loader2, Monitor, ShieldCheck } from "lucide-react"
import { useAudit, useTeam } from "@/features/accounts/api"
import { ACTION_LABELS, ACTION_TONE, type AuditEvent } from "@/features/accounts/types"
import { usePermissions } from "@/features/dashboard/access"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost, inputClass } from "@/features/dashboard/styles"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const MODULES: Record<string, string> = {
  requests: "Sales requests",
  billing: "Quotes & invoices",
  operations: "Operations",
  content: "Website content",
  events: "Events",
  insights: "Insights",
  settings: "Settings",
  users: "Users & roles",
  audit: "Activity log",
}

const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" })
const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

/** "Chrome on Windows" from a browser's user agent, enough to recognise a device */
function device(agent: string) {
  if (!agent) return ""
  const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser"
  const os = /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iPhone/iPad" : /Windows/.test(agent) ? "Windows" : /Mac OS/.test(agent) ? "Mac" : /Linux/.test(agent) ? "Linux" : ""
  return os ? `${browser} on ${os}` : browser
}

function Row({ event }: { event: AuditEvent }) {
  const [open, setOpen] = useState(false)
  const changes = Object.entries(event.changes ?? {})
  return (
    <li className="px-4 py-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left flex items-start gap-3" aria-expanded={open}>
        <span className="text-xs tabular-nums text-foreground/50 w-12 flex-shrink-0 pt-0.5">{time.format(new Date(event.created_at))}</span>
        <span className="min-w-0 flex-1">
          <span className="text-sm">
            <b>{event.actor.name}</b> <span className="text-foreground/80">{event.summary}</span>
          </span>
          <span className="flex flex-wrap items-center gap-1.5 mt-1">
            <Pill className={ACTION_TONE[event.action] ?? "bg-foreground/5 text-foreground/70 border-foreground/15"}>{ACTION_LABELS[event.action] ?? event.action}</Pill>
            {event.module && <span className="text-[11px] text-foreground/50">{MODULES[event.module] ?? event.module}</span>}
            {event.ip && <span className="text-[11px] text-foreground/45">· {event.ip}</span>}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-foreground/40 flex-shrink-0 mt-1 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 ml-15 sm:ml-[60px] rounded-xl bg-card/60 border border-border p-3 text-xs space-y-2">
          {changes.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="text-left text-foreground/50">
                  <th className="font-semibold pb-1 pr-2">Field</th>
                  <th className="font-semibold pb-1 pr-2">Before</th>
                  <th className="font-semibold pb-1">After</th>
                </tr>
              </thead>
              <tbody>
                {changes.map(([field, [before, after]]) => (
                  <tr key={field} className="align-top">
                    <td className="pr-2 py-0.5 font-medium">{field.replace(/_/g, " ")}</td>
                    <td className="pr-2 py-0.5 text-red-700/80 break-all">{before || "—"}</td>
                    <td className="py-0.5 text-emerald-700 break-all">{after || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-foreground/55 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5" />
              {device(event.user_agent) || "Unknown device"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {event.ip ?? "No address"}
            </span>
            <span className="font-mono">
              {event.method} {event.path} → {event.status_code}
            </span>
          </p>
        </div>
      )}
    </li>
  )
}

export default function ActivityPage() {
  const { can } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const [filters, setFilters] = useState({ actor: searchParams.get("actor") ?? "", module: "", action: "", since: "", until: "" })
  const [pages, setPages] = useState(1)
  const { data: people = [] } = useTeam("", can("users.view"))
  const params = useMemo(() => ({ ...filters, q: search }), [filters, search])
  useEffect(() => setPages(1), [params])
  useEffect(() => {
    if (filters.actor) setSearchParams({ actor: filters.actor }, { replace: true })
    else setSearchParams({}, { replace: true })
  }, [filters.actor, setSearchParams])

  const set = (key: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <PageHeader title="Activity log" subtitle="Who did what in the dashboard, and when. Written by the server; nobody can edit or delete it." />

      <div className="glass rounded-2xl p-4 mb-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sm:col-span-2 lg:col-span-5">
          <SearchInput value={q} onChange={setQ} placeholder="Search what was done, a record, a name or an IP address..." />
        </div>
        {can("users.view") && (
          <select value={filters.actor} onChange={set("actor")} aria-label="Person" className={inputClass}>
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.username}
              </option>
            ))}
          </select>
        )}
        <select value={filters.module} onChange={set("module")} aria-label="Area" className={inputClass}>
          <option value="">All areas</option>
          {Object.entries(MODULES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.action} onChange={set("action")} aria-label="Action" className={inputClass}>
          <option value="">All actions</option>
          {["create", "update", "destroy", "publish", "login", "login_failed", "denied", "set_password"].map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
        <input type="date" value={filters.since} onChange={set("since")} aria-label="From" className={inputClass} />
        <input type="date" value={filters.until} onChange={set("until")} aria-label="Until" className={inputClass} />
      </div>

      {Array.from({ length: pages }, (_, i) => (
        <ActivityPageChunk key={i} params={params} offset={i * 50} last={i === pages - 1} onMore={() => setPages((p) => p + 1)} />
      ))}

      <p className="text-xs text-foreground/50 mt-6 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        The person, time, address and device come from the server, not from the browser, so they cannot be faked from the dashboard.
      </p>
    </>
  )
}

function ActivityPageChunk({ params, offset, last, onMore }: { params: Record<string, string>; offset: number; last: boolean; onMore: () => void }) {
  const { data, isLoading, isError, refetch, isFetching } = useAudit(params, offset)
  if (isLoading) return <ListSkeleton rows={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!data) return null
  if (offset === 0 && data.results.length === 0) return <EmptyState title="Nothing recorded for these filters" />

  // Group by day for easy reading
  const groups: { label: string; events: AuditEvent[] }[] = []
  for (const event of data.results) {
    const label = day.format(new Date(event.created_at))
    if (groups.at(-1)?.label === label) groups.at(-1)!.events.push(event)
    else groups.push({ label, events: [event] })
  }

  return (
    <>
      {groups.map((g) => (
        <section key={`${offset}-${g.label}`} className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/50 mb-2">{g.label}</h2>
          <ul className="glass rounded-2xl divide-y divide-border">
            {g.events.map((event) => (
              <Row key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}
      {last && offset + data.results.length < data.count && (
        <div className="flex justify-center">
          <button type="button" onClick={onMore} disabled={isFetching} className={cn(buttonGhost, "h-11 px-5")}>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Show older ({data.count - offset - data.results.length} more)
          </button>
        </div>
      )}
    </>
  )
}
