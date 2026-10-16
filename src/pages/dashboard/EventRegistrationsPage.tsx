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
    cells(["Name", "Phone", "Email", "School/Company", "Status", "Amount", "Transaction ID", "Ticket", "Checked in", "Registered"]),
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
        r.checked_in ? "Yes" : "",
        new Date(r.created_at).toLocaleString("en-GB"),
      ]),
    ),
  ]
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" })),
    download: `registrations-${event.slug}.csv`,
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
            title: `${first} is confirmed ✅`,
            description: registration.email ? "The ticket was sent to their email." : "Send them the ticket on WhatsApp.",
          }),
        onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
      },
    )

  const whatsappText =
    registration.status === "confirmed"
      ? `Hi ${first}, your registration for *${event.title}* is confirmed ✅\n\nYour ticket (with QR code): ${ticketUrl(registration.id)}\n\nSee you on ${formatEventDay(event.starts_at)}!`
      : `Hi ${first}, this is RynexNative about your registration for *${event.title}*.\n\nYour ticket: ${ticketUrl(registration.id)}`

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
            {formatWhen(registration.created_at)} · Ticket <span className="font-mono font-semibold">{registration.ticket_code}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <Pill className={status.className}>{status.label}</Pill>
          {registration.checked_in && <p className="text-[11px] text-emerald-500 font-semibold">✓ Checked in</p>}
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
            Amount: <strong>{formatPrice(registration.amount)}</strong>
          </span>
          {registration.payment_reference ? (
            <span>
              Transaction: <strong className="font-mono">{registration.payment_reference}</strong>
            </span>
          ) : (
            <span className="text-foreground/50">No transaction ID yet</span>
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
            {registration.amount > 0 ? "Confirm payment" : "Confirm"}
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
            Cancel
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
      <Link to="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">{event?.title ?? "…"}</h1>
          {event && (
            <p className="text-foreground/60 mt-1">
              {formatEventDay(event.starts_at)} · {formatPrice(event.price)}
              {event.capacity ? ` · ${event.capacity} seats` : ""}
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
            ["Confirmed", event.counts.confirmed, "text-emerald-500"],
            ["Payments to verify", event.counts.to_verify, event.counts.to_verify ? "text-accent" : ""],
            ["Awaiting payment", event.counts.awaiting_payment, "text-amber-500"],
            ["Checked in", event.counts.checked_in, ""],
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
            { id: "all", label: "All" },
            { id: "payment_submitted", label: "Verify payment" },
            { id: "pending_payment", label: "Not paid" },
            { id: "confirmed", label: "Confirmed" },
            { id: "cancelled", label: "Cancelled" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Name, phone, ticket, transaction..." />
      </div>

      {isLoading || !event ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={filter === "payment_submitted" ? "No payments to verify 🎉" : "No registrations here"}
          text={filter === "all" && !search ? "Share the event link so people can register." : undefined}
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
            <AlertDialogTitle>Cancel {cancelling?.name}'s registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Their ticket will stop working and the seat becomes free. If they already paid, remember to refund them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                cancelling &&
                setStatus.mutate({ id: cancelling.id, status: "cancelled" }, { onSuccess: () => toast({ title: "Registration cancelled" }) })
              }
            >
              Cancel registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
