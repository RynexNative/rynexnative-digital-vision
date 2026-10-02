import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Building2, CheckCircle2, Download, Mail, Phone, ScanLine, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useEventAdmin, useRegistrationsAdmin, useSetRegistrationStatus } from "@/features/dashboard/api"
import { buttonGhost } from "@/features/dashboard/styles"
import { formatWhen, whatsappNumber, type DashboardEvent, type DashboardRegistration } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, Pill, SearchInput } from "@/features/dashboard/ui"
import { REGISTRATION_STATUS, formatEventDay, formatPrice, ticketUrl, type RegistrationStatus } from "@/features/events/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Filter = RegistrationStatus | "all"

function exportCsv(event: DashboardEvent, rows: DashboardRegistration[]) {
  const cells = (values: (string | number)[]) => values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  const lines = [
    cells(["Jina", "Simu", "Email", "Chuo/Kampuni", "Hali", "Kiasi", "Namba ya muamala", "Tiketi", "Ameingia", "Alijisajili"]),
    ...rows.map((r) =>
      cells([
        r.name,
        r.phone,
        r.email,
        r.organization,
        REGISTRATION_STATUS[r.status].label,
        r.amount,
        r.payment_reference,
        r.ticket_code,
        r.checked_in ? "Ndiyo" : "",
        new Date(r.created_at).toLocaleString("en-GB"),
      ]),
    ),
  ]
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" })),
    download: `usajili-${event.slug}.csv`,
  })
  link.click()
  URL.revokeObjectURL(link.href)
}

function RegistrationCard({ registration, event, onCancel }: { registration: DashboardRegistration; event: DashboardEvent; onCancel: () => void }) {
  const { toast } = useToast()
  const setStatus = useSetRegistrationStatus()
  const status = REGISTRATION_STATUS[registration.status]
  const first = registration.name.split(" ")[0]
  const canConfirm = registration.status === "pending_payment" || registration.status === "payment_submitted"

  const confirm = () =>
    setStatus.mutate(
      { id: registration.id, status: "confirmed" },
      {
        onSuccess: () =>
          toast({
            title: `${first} amethibitishwa ✅`,
            description: registration.email ? "Tiketi imetumwa kwa email yake." : "Mtumie tiketi kwa WhatsApp.",
          }),
        onError: (error) => toast({ variant: "destructive", title: "Imeshindikana", description: errorMessage(error, "Jaribu tena.") }),
      },
    )

  const whatsappText =
    registration.status === "confirmed"
      ? `Habari ${first}, usajili wako wa *${event.title}* umethibitishwa ✅\n\nTiketi yako (yenye QR code): ${ticketUrl(registration.id)}\n\nTutaonana ${formatEventDay(event.starts_at)}!`
      : `Habari ${first}, ni RynexNative kuhusu usajili wako wa *${event.title}*.\n\nTiketi yako: ${ticketUrl(registration.id)}`

  return (
    <li className={cn("glass rounded-2xl p-5", registration.status === "payment_submitted" && "border-accent/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-lg leading-tight">{registration.name}</p>
          {registration.organization && (
            <p className="text-sm text-foreground/60 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {registration.organization}
            </p>
          )}
          <p className="text-xs text-foreground/50 mt-1">
            {formatWhen(registration.created_at)} · Tiketi <span className="font-mono font-semibold">{registration.ticket_code}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <Pill className={status.className}>{status.label}</Pill>
          {registration.checked_in && <p className="text-[11px] text-emerald-500 font-semibold">✓ Ameingia</p>}
        </div>
      </div>

      {registration.amount > 0 && (
        <div
          className={cn(
            "mt-4 rounded-xl p-3 text-sm flex flex-wrap items-center justify-between gap-2",
            registration.status === "payment_submitted" ? "bg-accent/10" : "bg-card/50",
          )}
        >
          <span>
            Kiasi: <strong>{formatPrice(registration.amount)}</strong>
          </span>
          {registration.payment_reference ? (
            <span>
              Muamala: <strong className="font-mono">{registration.payment_reference}</strong>
            </span>
          ) : (
            <span className="text-foreground/50">Bado hajaweka namba ya muamala</span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canConfirm && (
          <button
            type="button"
            onClick={confirm}
            disabled={setStatus.isPending}
            className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {registration.amount > 0 ? "Thibitisha malipo" : "Thibitisha"}
          </button>
        )}
        <a
          href={`https://wa.me/${whatsappNumber(registration.phone)}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-lg bg-[#25D366] text-white inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-[#1ebe5b]"
        >
          WhatsApp
        </a>
        <a href={`tel:${registration.phone}`} className={buttonGhost}>
          <Phone className="h-4 w-4" />
          {registration.phone}
        </a>
        {registration.email && (
          <a href={`mailto:${registration.email}`} className={buttonGhost}>
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
        {registration.status !== "cancelled" && (
          <button type="button" onClick={onCancel} className={cn(buttonGhost, "hover:text-red-500")}>
            <XCircle className="h-4 w-4" />
            Ghairi
          </button>
        )}
      </div>
    </li>
  )
}

export default function EventRegistrationsPage() {
  const { id = "" } = useParams()
  const { toast } = useToast()
  const { data: event, isError: eventError, refetch: refetchEvent } = useEventAdmin(id)
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data: rows = [], isLoading, isError, refetch } = useRegistrationsAdmin(id, filter === "all" ? "" : filter, search)
  const setStatus = useSetRegistrationStatus()
  const [cancelling, setCancelling] = useState<DashboardRegistration | null>(null)

  if (eventError) return <ErrorState onRetry={() => refetchEvent()} />

  return (
    <>
      <Link to="/admin/matukio" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" />
        Matukio yote
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">{event?.title ?? "…"}</h1>
          {event && (
            <p className="text-foreground/60 mt-1">
              {formatEventDay(event.starts_at)} · {formatPrice(event.price)}
              {event.capacity ? ` · nafasi ${event.capacity}` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/admin/scan" className={cn(buttonGhost, "h-11 px-4")}>
            <ScanLine className="h-4 w-4" />
            Scan
          </Link>
          {event && rows.length > 0 && (
            <button type="button" onClick={() => exportCsv(event, rows)} className={cn(buttonGhost, "h-11 px-4")}>
              <Download className="h-4 w-4" />
              CSV
            </button>
          )}
        </div>
      </div>

      {event && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            ["Wamethibitishwa", event.counts.confirmed, "text-emerald-500"],
            ["Malipo ya kukagua", event.counts.to_verify, event.counts.to_verify ? "text-accent" : ""],
            ["Wanasubiri kulipa", event.counts.awaiting_payment, "text-amber-500"],
            ["Wameingia", event.counts.checked_in, ""],
          ].map(([label, value, color]) => (
            <div key={label as string} className="glass rounded-2xl p-4">
              <p className="text-xs text-foreground/60">{label}</p>
              <p className={cn("text-2xl font-bold font-poppins", color as string)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "Wote" },
            { id: "payment_submitted", label: "Kukagua malipo" },
            { id: "pending_payment", label: "Hawajalipa" },
            { id: "confirmed", label: "Wamethibitishwa" },
            { id: "cancelled", label: "Wameghairiwa" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Jina, simu, tiketi, muamala..." />
      </div>

      {isLoading || !event ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={filter === "payment_submitted" ? "Hakuna malipo ya kukagua 🎉" : "Hakuna usajili hapa"}
          text={filter === "all" && !search ? "Share link ya tukio ili watu wajisajili." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <RegistrationCard key={r.id} registration={r} event={event} onCancel={() => setCancelling(r)} />
          ))}
        </ul>
      )}

      <AlertDialog open={cancelling !== null} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ghairi usajili wa {cancelling?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiketi yake itaacha kufanya kazi na nafasi yake itakuwa wazi. Kama alishalipa, kumbuka kumrudishia pesa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rudi</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                cancelling &&
                setStatus.mutate({ id: cancelling.id, status: "cancelled" }, { onSuccess: () => toast({ title: "Usajili umeghairiwa" }) })
              }
            >
              Ghairi usajili
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
