import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Copy, Mail, MapPin, MessageSquareText, Pencil, Printer, User } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost } from "@/features/dashboard/styles"
import { ErrorState, FilterTabs, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { useCustomer } from "@/features/farm/api"
import { ContactButtons } from "@/features/farm/customers"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { customerFields } from "@/features/farm/fields"
import { toValues, type Values } from "@/features/farm/form"
import { SaleList } from "@/features/farm/lists"
import { NoteList } from "@/features/farm/notes"
import { OrderList } from "@/features/farm/orders"
import { CUSTOMER_KINDS, SEGMENT_HELP, SEGMENT_STYLE, daysAgo, intlPhone, localPhone, prettyPhone, shortDate, tzs } from "@/features/farm/types"
import { FARM, Stat } from "@/features/farm/ui"
import { useToast } from "@/hooks/use-toast"

type Tab = "notes" | "orders" | "sales"

export default function CustomerDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { can } = usePermissions()
  const { data: c, isLoading, isError, refetch } = useCustomer(id)
  const [tab, setTab] = useState<Tab>("notes")
  const [editing, setEditing] = useState(false)

  if (isLoading) return <ListSkeleton rows={3} />
  if (isError || !c) return <ErrorState onRetry={() => refetch()} />
  const st = c.stats
  const owes = Number(st.owes)
  const numbers = [c.phone, c.phone2].filter(Boolean)
  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => toast({ title: "Copied" }))

  return (
    <div>
      <Link to={`${FARM}/customers`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Customers
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-poppins">{c.name}</h1>
            <Pill className={SEGMENT_STYLE[st.segment]}>{c.is_active ? st.segment_label : "No longer buying"}</Pill>
          </div>
          <p className="text-foreground/60 mt-1">
            {CUSTOMER_KINDS[c.kind]} · {SEGMENT_HELP[st.segment]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ContactButtons customer={c} />
          {c.phone && (
            <a href={`sms:${intlPhone(c.phone)}`} className={buttonGhost}>
              <MessageSquareText className="h-4 w-4" />
              SMS
            </a>
          )}
          <button type="button" onClick={() => navigate(`${FARM}/customers/${c.id}/statement`)} className={buttonGhost}>
            <Printer className="h-4 w-4" />
            Statement
          </button>
          {can("cp_sales.manage") && (
            <button type="button" onClick={() => setEditing(true)} className={buttonGhost}>
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-6 grid sm:grid-cols-2 gap-2 text-sm">
        {c.contact_person && (
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-600" />
            {c.contact_person}
          </p>
        )}
        {numbers.map((n) => (
          <button key={n} type="button" onClick={() => copy(localPhone(n))} className="flex items-center gap-2 text-left hover:text-amber-700" title="Copy">
            <Copy className="h-4 w-4 text-amber-600" />
            {prettyPhone(n)}
          </button>
        ))}
        {c.email && (
          <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-amber-700 truncate">
            <Mail className="h-4 w-4 text-amber-600" />
            {c.email}
          </a>
        )}
        {c.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            {c.location}
          </p>
        )}
        {c.notes && <p className="sm:col-span-2 text-foreground/70 whitespace-pre-line border-t border-border pt-2 mt-1">{c.notes}</p>}
        <p className="sm:col-span-2 text-xs text-foreground/50">
          Customer since {shortDate(c.created_at.slice(0, 10))}
          {c.created_by && `, added by ${c.created_by.name}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Purchases" value={st.purchases} sub={st.first_purchase ? `since ${shortDate(st.first_purchase)}` : "none yet"} />
        <Stat
          label="Last bought"
          value={st.last_purchase ? daysAgo(st.days_since) : "—"}
          sub={st.usual_gap_days ? `usually every ${st.usual_gap_days} days` : undefined}
        />
        <Stat label="Next likely" value={st.next_expected ? shortDate(st.next_expected) : "—"} sub={st.segment === "quiet" ? "overdue: give them a call" : undefined} />
        <Stat label="Bought in total" value={tzs(st.bought)} sub={`${st.birds_bought} birds`} />
        <Stat label={owes < 0 ? "We owe them" : "Owes"} value={tzs(Math.abs(owes))} tone={owes > 0 ? "bad" : undefined} sub={owes < 0 ? "refund it on the sale" : undefined} />
        <Stat label="Open orders" value={st.open_orders} sub={Number(st.deposits_held) > 0 ? `deposits held ${tzs(st.deposits_held)}` : undefined} />
      </div>

      <div className="mb-4">
        <FilterTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "notes", label: "Contact log" },
            { id: "orders", label: "Orders & deposits" },
            { id: "sales", label: "Sales & payments" },
          ]}
        />
      </div>
      {tab === "notes" && <NoteList customer={c.id} />}
      {tab === "orders" && <OrderList customer={c.id} />}
      {tab === "sales" && <SaleList params={{ customer: String(c.id) }} showAdd={false} />}

      {editing && (
        <FarmSheet
          resource="customers"
          title={`Edit ${c.name}`}
          fields={customerFields}
          initial={{ ...toValues(customerFields, c as unknown as Values), is_active: String(c.is_active) }}
          recordId={c.id}
          deleteText="Only a customer with no sales or orders can be deleted; otherwise mark them as no longer buying (their history stays). Deleted customers are kept under Deleted items."
          onClose={() => setEditing(false)}
          onDeleted={() => navigate(`${FARM}/customers`, { replace: true })}
        />
      )}
    </div>
  )
}
