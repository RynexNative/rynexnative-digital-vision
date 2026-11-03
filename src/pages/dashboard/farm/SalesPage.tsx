import { useState } from "react"
import { Phone, Plus } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { whatsappNumber } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { useCustomers } from "@/features/farm/api"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { farmButton, toValues, type Values } from "@/features/farm/form"
import { customerDefaults, customerFields } from "@/features/farm/fields"
import { SaleList } from "@/features/farm/lists"
import { CUSTOMER_KINDS, num, tzs, type Customer } from "@/features/farm/types"
import { cn } from "@/lib/utils"

type Tab = "sales" | "unpaid" | "customers"

function Customers() {
  const { can } = usePermissions()
  const [q, setQ] = useState("")
  const { data, isLoading, isError, refetch } = useCustomers({ q })
  const [editing, setEditing] = useState<Customer | "new" | null>(null)
  const manage = can("cp_sales.manage")
  return (
    <section>
      <div className="flex flex-wrap gap-3 justify-between mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search customers" />
        {manage && (
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        )}
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="No customers yet" text="Hotels, restaurants, shops and regular buyers." />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {data.map((c) => (
            <li key={c.id} className={cn("glass rounded-2xl p-4", !c.is_active && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <button type="button" disabled={!manage} onClick={() => setEditing(c)} className="text-left min-w-0 enabled:hover:text-amber-700">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-foreground/55 truncate">{[c.contact_person, c.location].filter(Boolean).join(" · ") || " "}</p>
                </button>
                <Pill className="bg-amber-500/10 text-amber-800 border-amber-500/30 dark:text-amber-300">{CUSTOMER_KINDS[c.kind]}</Pill>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2 text-sm">
                <div>
                  <p className="text-foreground/55 text-xs">{num(c.sales_count)} sales</p>
                  <p className="font-semibold tabular-nums">{tzs(c.bought)}</p>
                </div>
                {Number(c.owes) > 0 ? <p className="text-red-600 font-semibold tabular-nums">Owes {tzs(c.owes)}</p> : <p className="text-emerald-600 text-xs font-semibold">Nothing owed</p>}
              </div>
              {c.phone && (
                <a href={`https://wa.me/${whatsappNumber(c.phone)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-amber-700">
                  <Phone className="h-3.5 w-3.5" />
                  {c.phone}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <FarmSheet
          resource="customers"
          title={editing === "new" ? "Add customer" : editing.name}
          fields={customerFields}
          initial={editing === "new" ? customerDefaults() : { ...toValues(customerFields, editing as unknown as Values), is_active: String(editing.is_active) }}
          recordId={editing === "new" ? undefined : editing.id}
          deleteText="Only a customer with no sales can be deleted. Mark them as no longer buying instead."
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>("sales")
  return (
    <div>
      <PageHeader title="Sales & customers" subtitle="Chicken sold to hotels and other customers, and the money still to come in." />
      <div className="mb-5">
        <FilterTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "sales", label: "All sales" },
            { id: "unpaid", label: "Not fully paid" },
            { id: "customers", label: "Customers" },
          ]}
        />
      </div>
      {tab === "sales" && <SaleList />}
      {tab === "unpaid" && <SaleList params={{ unpaid: "1" }} showAdd={false} />}
      {tab === "customers" && <Customers />}
    </div>
  )
}
