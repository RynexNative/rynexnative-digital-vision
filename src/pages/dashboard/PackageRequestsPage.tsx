import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Building2, Clock, FileText, Gem, Loader2, Mail, MessageCircle, Phone, Signpost } from "lucide-react"
import { useQuoteFromRequest } from "@/features/billing/api"
import { useInquiriesAdmin, useSetInquiryStatus } from "@/features/dashboard/api"
import { INQUIRY_STATUS, formatWhen, whatsappNumber, type DashboardInquiry, type InquiryStatus } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary } from "@/features/dashboard/styles"
import { CONTACT_OPTIONS } from "@/features/packages/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Filter = InquiryStatus | "all"

function RequestCard({ inquiry }: { inquiry: DashboardInquiry }) {
  const { toast } = useToast()
  const setStatus = useSetInquiryStatus()
  const createQuote = useQuoteFromRequest()
  const navigate = useNavigate()
  const first = inquiry.name.split(" ")[0]
  const whatsappText = `Hi ${first}, this is RynexNative. Thank you for your interest in our ${inquiry.package_name} package. When is a good time to talk about your goals?`

  const changeStatus = (status: InquiryStatus) =>
    setStatus.mutate(
      { id: inquiry.id, status },
      {
        onSuccess: () => toast({ title: `Status: ${INQUIRY_STATUS[status].label}` }),
        onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: serverMessage(error, "Please try again.") }),
      },
    )
  const markContacted = () => inquiry.status === "new" && changeStatus("contacted")

  // One click: finds or creates the client and opens a quote with this package on it
  const quote = () =>
    createQuote.mutate(inquiry.id, {
      onSuccess: (doc) => navigate(`/admin/billing/${doc.id}`),
      onError: (error) => toast({ variant: "destructive", title: "Could not create the quote", description: serverMessage(error, "Please try again.") }),
    })

  return (
    <li className={cn("glass rounded-2xl p-5", inquiry.status === "new" && "border-primary/30")}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-lg leading-tight">{inquiry.name}</p>
          {inquiry.company && (
            <p className="text-sm text-foreground/60 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {inquiry.company}
            </p>
          )}
          <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatWhen(inquiry.created_at)} · prefers {CONTACT_OPTIONS[inquiry.preferred_contact]}
          </p>
          {inquiry.source && (
            <p className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1.5">
              <Signpost className="h-3.5 w-3.5" />
              Came from {inquiry.source}
              {inquiry.landing_page && ` · first page ${inquiry.landing_page}`}
            </p>
          )}
        </div>
        <select
          value={inquiry.status}
          onChange={(e) => changeStatus(e.target.value as InquiryStatus)}
          disabled={setStatus.isPending}
          aria-label="Status"
          className={cn(
            "h-9 pl-3 pr-8 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary bg-transparent",
            INQUIRY_STATUS[inquiry.status].className,
          )}
        >
          {(Object.keys(INQUIRY_STATUS) as InquiryStatus[]).map((s) => (
            <option key={s} value={s} className="bg-card text-foreground">
              {INQUIRY_STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-xl bg-card/50 p-3 text-sm flex items-center gap-2">
        <Gem className="h-4 w-4 text-primary flex-shrink-0" />
        {inquiry.package_slug ? (
          <Link to={`/packages/${inquiry.package_slug}`} target="_blank" className="font-semibold hover:text-primary">
            {inquiry.package_name}
          </Link>
        ) : (
          <span className="font-semibold">{inquiry.package_name}</span>
        )}
      </div>

      {inquiry.message && (
        <p className="mt-3 text-sm text-foreground/80 whitespace-pre-line border-l-2 border-primary/40 pl-3">{inquiry.message}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {inquiry.quote ? (
          <Link to={`/admin/billing/${inquiry.quote.id}`} className={cn(buttonGhost, "text-primary")}>
            <FileText className="h-4 w-4" />
            Quote {inquiry.quote.number}
          </Link>
        ) : (
          <button type="button" onClick={quote} disabled={createQuote.isPending} className={cn(buttonPrimary, "h-9 px-3 text-sm rounded-lg")}>
            {createQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Create quote
          </button>
        )}
        <a
          href={`https://wa.me/${whatsappNumber(inquiry.phone)}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markContacted}
          className="h-9 px-3 rounded-lg bg-[#25D366] text-white inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a href={`tel:${inquiry.phone}`} onClick={markContacted} className={buttonGhost}>
          <Phone className="h-4 w-4" />
          {inquiry.phone}
        </a>
        {inquiry.email && (
          <a
            href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`${inquiry.package_name} - RynexNative`)}`}
            onClick={markContacted}
            className={buttonGhost}
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>
    </li>
  )
}

export default function PackageRequestsPage() {
  const [filter, setFilter] = useState<Filter>("new")
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data = [], isLoading, isError, refetch } = useInquiriesAdmin(filter === "all" ? "" : filter, search)

  return (
    <>
      <PageHeader
        title="Package requests"
        subtitle="People who asked for a package. A quick, personal reply builds trust: aim for the same day."
        action={
          <Link to="/admin/packages" className={cn(buttonGhost, "h-11 px-4")}>
            <Gem className="h-4 w-4" />
            Manage packages
          </Link>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "new", label: "New" },
            { id: "contacted", label: "Contacted" },
            { id: "won", label: "Won" },
            { id: "lost", label: "Lost" },
            { id: "all", label: "All" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, package..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          title={filter === "new" && !search ? "No new requests 🎉" : "No requests here"}
          text={filter === "new" && !search ? "New package requests will appear here." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {data.map((inquiry) => (
            <RequestCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </ul>
      )}
    </>
  )
}
