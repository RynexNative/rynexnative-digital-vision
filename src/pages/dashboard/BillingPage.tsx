import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertTriangle, FileText, Plus, Receipt, Wallet } from "lucide-react"
import { useDocuments } from "@/features/billing/api"
import { KIND_LABEL, STATE_LABEL, money, moneyMap, type BillingDocument } from "@/features/billing/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary } from "@/features/dashboard/styles"
import { useOpsSummary } from "@/features/operations/api"
import { formatDate } from "@/features/operations/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "quotes", label: "Quotes", params: { kind: "quote" } },
  { id: "invoices", label: "Invoices", params: { kind: "invoice" } },
  { id: "overdue", label: "Overdue", params: { kind: "invoice", state: "overdue" } },
  { id: "drafts", label: "Drafts", params: { status: "draft" } },
  { id: "all", label: "All", params: {} },
] as const

type TabId = (typeof TABS)[number]["id"]

function DocumentRow({ doc }: { doc: BillingDocument }) {
  const state = STATE_LABEL[doc.state]
  const isInvoice = doc.kind === "invoice"
  const date = isInvoice ? doc.due_date : doc.valid_until
  return (
    <li>
      <Link
        to={`/admin/billing/${doc.id}`}
        className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-primary/40 transition-colors"
      >
        <span className="hidden sm:flex h-11 w-11 rounded-xl bg-primary/10 text-primary items-center justify-center flex-shrink-0">
          {isInvoice ? <Receipt className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{doc.number}</span>
            <Pill className={state.className}>{state.label}</Pill>
          </span>
          <span className="block text-sm text-foreground/70 truncate mt-0.5">
            {doc.bill_to_company || doc.bill_to_name}
            {doc.title && <span className="text-foreground/50"> · {doc.title}</span>}
          </span>
          <span className="block text-xs text-foreground/50 mt-0.5">
            {KIND_LABEL[doc.kind]} · {formatDate(doc.issue_date)}
            {date && ` · ${isInvoice ? "due" : "valid until"} ${formatDate(date)}`}
          </span>
        </span>
        <span className="text-right flex-shrink-0">
          <span className="block font-semibold">{money(doc.total, doc.currency)}</span>
          {isInvoice && Number(doc.balance) > 0 && Number(doc.amount_paid) > 0 && (
            <span className="block text-xs text-amber-700">{money(doc.balance, doc.currency)} left</span>
          )}
        </span>
      </Link>
    </li>
  )
}

export default function BillingPage() {
  const [searchParams] = useSearchParams()
  const initial = (searchParams.get("tab") as TabId | null) ?? "quotes"
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initial) ? initial : "quotes")
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]
  const { data = [], isLoading, isError, refetch } = useDocuments({ ...active.params, q: search })
  const { data: summary } = useOpsSummary()
  const billing = summary?.billing

  return (
    <>
      <PageHeader
        title="Quotes & invoices"
        subtitle="Send a quotation with our logo in one click, turn it into an invoice when the client agrees, then record each payment."
        action={
          <div className="flex gap-2">
            <Link to="/admin/billing/new?kind=invoice" className={cn(buttonGhost, "h-11 px-4")}>
              <Receipt className="h-4 w-4" />
              New invoice
            </Link>
            <Link to="/admin/billing/new?kind=quote" className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              New quote
            </Link>
          </div>
        }
      />

      {billing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-foreground/60 flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> Waiting to be paid
            </p>
            <p className="text-xl font-bold font-poppins mt-1">{moneyMap(billing.outstanding)}</p>
            <p className="text-xs text-foreground/50">{billing.unpaid_invoices} invoice(s)</p>
          </div>
          <button
            type="button"
            onClick={() => setTab("overdue")}
            className={cn("glass rounded-2xl p-4 text-left", billing.overdue_invoices > 0 && "border-red-500/40")}
          >
            <p className="text-sm text-foreground/60 flex items-center gap-1.5">
              <AlertTriangle className={cn("h-4 w-4", billing.overdue_invoices > 0 && "text-red-600")} /> Overdue
            </p>
            <p className={cn("text-xl font-bold font-poppins mt-1", billing.overdue_invoices > 0 && "text-red-700")}>{moneyMap(billing.overdue)}</p>
            <p className="text-xs text-foreground/50">{billing.overdue_invoices} invoice(s)</p>
          </button>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-foreground/60">Paid this month</p>
            <p className="text-xl font-bold font-poppins mt-1 text-emerald-700">{moneyMap(billing.paid_this_month)}</p>
            <p className="text-xs text-foreground/50">
              {billing.open_quotes} open quote(s) worth {moneyMap(billing.open_quotes_value)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs value={tab} onChange={setTab} options={TABS.map((t) => ({ id: t.id, label: t.label }))} />
        <SearchInput value={q} onChange={setQ} placeholder="Search number, client, title..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          title={search ? "Nothing matches" : tab === "overdue" ? "No overdue invoices 🎉" : "Nothing here yet"}
          text={
            search || tab === "overdue"
              ? undefined
              : "Open a package request and press “Create quote”, or start a new quote here."
          }
          action={
            !search &&
            tab !== "overdue" && (
              <Link to={`/admin/billing/new?kind=${tab === "invoices" ? "invoice" : "quote"}`} className={buttonPrimary}>
                <Plus className="h-4 w-4" />
                {tab === "invoices" ? "New invoice" : "New quote"}
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </ul>
      )}
    </>
  )
}
