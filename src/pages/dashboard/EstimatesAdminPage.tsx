import { useState } from "react"
import { Building2, Clock, Mail, Phone } from "lucide-react"
import { useEstimatesAdmin, useSetEstimateStatus } from "@/features/dashboard/api"
import { ESTIMATE_STATUS, formatWhen, whatsappNumber, type DashboardEstimate, type EstimateStatus } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { formatTZS } from "@/features/estimator/calculate"
import { DESIGN_OPTIONS, FEATURES, PROJECT_TYPES, TIMELINE_OPTIONS, type FeatureId } from "@/features/estimator/pricing"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Filter = EstimateStatus | "all"

function describeSelections(estimate: DashboardEstimate) {
  const type = PROJECT_TYPES.find((t) => t.id === estimate.project_type)
  const { scale, features = [], design, timeline } = estimate.selections ?? {}
  return {
    type: type?.label ?? estimate.project_type,
    scale: type?.scales.find((s) => s.id === scale),
    features: features.map((f) => FEATURES[f as FeatureId]?.label ?? f),
    design: type?.hasDesign ? DESIGN_OPTIONS.find((d) => d.id === design)?.label : undefined,
    timeline: TIMELINE_OPTIONS.find((t) => t.id === timeline)?.label,
  }
}

function EstimateCard({ estimate }: { estimate: DashboardEstimate }) {
  const { toast } = useToast()
  const setStatus = useSetEstimateStatus()
  const info = describeSelections(estimate)
  const firstName = estimate.name.split(" ")[0]
  const whatsappText = `Habari ${firstName}, ni RynexNative. Tumepokea ombi lako la ${info.type.toLowerCase()} (#${estimate.reference}). Tungependa kuzungumza zaidi kuhusu mahitaji yako.`

  const changeStatus = (status: EstimateStatus) =>
    setStatus.mutate(
      { id: estimate.id, status },
      {
        onSuccess: () => toast({ title: `Status: ${ESTIMATE_STATUS[status].label}` }),
        onError: (error) => toast({ variant: "destructive", title: "Imeshindikana", description: errorMessage(error, "Jaribu tena.") }),
      },
    )

  return (
    <li className="glass rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-lg leading-tight">{estimate.name}</p>
          {estimate.company && (
            <p className="text-sm text-foreground/60 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {estimate.company}
            </p>
          )}
          <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatWhen(estimate.created_at)} · #{estimate.reference}
          </p>
        </div>
        <select
          value={estimate.status}
          onChange={(e) => changeStatus(e.target.value as EstimateStatus)}
          disabled={setStatus.isPending}
          aria-label="Status"
          className={cn(
            "h-9 pl-3 pr-8 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary bg-transparent",
            ESTIMATE_STATUS[estimate.status].className,
          )}
        >
          {(Object.keys(ESTIMATE_STATUS) as EstimateStatus[]).map((s) => (
            <option key={s} value={s} className="bg-card text-foreground">
              {ESTIMATE_STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-xl bg-card/50 p-4 grid sm:grid-cols-[1fr,auto] gap-3">
        <div className="text-sm space-y-1">
          <p>
            <span className="font-semibold">{info.type}</span>
            {info.scale && <span className="text-foreground/60"> · {info.scale.label} ({info.scale.description})</span>}
          </p>
          {info.features.length > 0 && <p className="text-foreground/70">{info.features.join(", ")}</p>}
          <p className="text-xs text-foreground/50">{[info.design, info.timeline && `Muda: ${info.timeline}`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="sm:text-right">
          <p className="font-bold text-primary whitespace-nowrap">{formatTZS(estimate.estimate_min)}</p>
          <p className="text-xs text-foreground/60 whitespace-nowrap">hadi {formatTZS(estimate.estimate_max).replace("TZS ", "")}</p>
          <p className="text-xs text-foreground/50">
            Wiki {estimate.weeks_min}–{estimate.weeks_max}
          </p>
        </div>
      </div>

      {estimate.notes && <p className="mt-3 text-sm text-foreground/80 whitespace-pre-line border-l-2 border-primary/40 pl-3">{estimate.notes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:${estimate.phone}`} className={buttonGhost}>
          <Phone className="h-4 w-4" />
          {estimate.phone}
        </a>
        <a
          href={`https://wa.me/${whatsappNumber(estimate.phone)}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => estimate.status === "new" && changeStatus("contacted")}
          className="h-9 px-3 rounded-lg bg-[#25D366] text-white inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-[#1ebe5b]"
        >
          WhatsApp
        </a>
        {estimate.email && (
          <a href={`mailto:${estimate.email}?subject=${encodeURIComponent(`Ombi lako #${estimate.reference} - RynexNative`)}`} className={buttonGhost}>
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>
    </li>
  )
}

export default function EstimatesAdminPage() {
  const [filter, setFilter] = useState<Filter>("new")
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data = [], isLoading, isError, refetch } = useEstimatesAdmin(filter === "all" ? "" : filter, search)

  return (
    <>
      <PageHeader title="Maombi ya makadirio" subtitle="Wateja waliotumia kikokotoo cha bei. Wasiliana nao ndani ya saa 24." />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "new", label: "Mapya" },
            { id: "contacted", label: "Tumewasiliana" },
            { id: "won", label: "Tumepata" },
            { id: "lost", label: "Hayakufanikiwa" },
            { id: "all", label: "Yote" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Tafuta jina, simu, kampuni..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          title={filter === "new" && !search ? "Hakuna maombi mapya 🎉" : "Hakuna maombi hapa"}
          text={filter === "new" && !search ? "Umeshughulikia maombi yote." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {data.map((estimate) => (
            <EstimateCard key={estimate.id} estimate={estimate} />
          ))}
        </ul>
      )}
    </>
  )
}
