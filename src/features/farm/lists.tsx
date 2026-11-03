import { useState } from "react"
import { FileText, Loader2, Paperclip, Plus, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { usePermissions } from "@/features/dashboard/access"
import { EmptyState, ErrorState, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useDeleteSalePayment, useExpenses, useHealth, useSalePayment, useSales } from "./api"
import { FarmSheet } from "./FarmSheet"
import { farmButton, toBody, toValues, type Values } from "./form"
import { expenseDefaults, expenseFields, healthDefaults, healthFields, paymentFields, saleDefaults, saleFields, saleTotal } from "./fields"
import { CUSTOMER_KINDS, HEALTH_KINDS, isPdf, PAYMENT_METHODS, num, shortDate, today, tzs, type Expense, type HealthEvent, type Sale } from "./types"

const who = (p: { name: string } | null) => (p ? ` · by ${p.name}` : "")

/* ---------------- Health log ---------------- */

export function HealthList({ batch, params = {} }: { batch?: number; params?: Record<string, string> }) {
  const { can } = usePermissions()
  const filter = batch ? { ...params, batch: String(batch) } : params
  const { data, isLoading, isError, refetch } = useHealth(filter)
  const [editing, setEditing] = useState<HealthEvent | "new" | null>(null)
  const manage = can("cp_flocks.manage")
  const fields = healthFields(!batch)

  return (
    <section>
      {manage && (
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            Record deaths, sickness...
          </button>
        </div>
      )}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="Nothing recorded yet" text="Deaths, sickness, treatment, vaccinations and weighing show up here." />
      ) : (
        <ul className="space-y-2">
          {data.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                disabled={!manage}
                onClick={() => setEditing(e)}
                className="w-full text-left glass rounded-xl p-3 enabled:hover:border-amber-500/40 flex gap-3 items-start"
              >
                <Pill className={HEALTH_KINDS[e.kind].className}>{HEALTH_KINDS[e.kind].label}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {e.kind === "weighing" ? `Average ${e.avg_weight_kg} kg` : e.count ? `${num(e.count)} birds` : ""}
                    {e.disease && <span className="font-normal text-foreground/70"> · {e.disease}</span>}
                    {e.medicine && <span className="font-normal text-foreground/70"> · {e.medicine}</span>}
                  </p>
                  {e.notes && <p className="text-sm text-foreground/60 line-clamp-2">{e.notes}</p>}
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {shortDate(e.date)}
                    {!batch && ` · ${e.batch_code}`}
                    {who(e.created_by)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <FarmSheet
          resource="health"
          title={editing === "new" ? "Health record" : `${HEALTH_KINDS[editing.kind].label} on ${shortDate(editing.date)}`}
          description="Many deaths at once alert the farm team on their phones."
          fields={fields}
          initial={editing === "new" ? healthDefaults() : toValues(fields, editing as unknown as Values)}
          recordId={editing === "new" ? undefined : editing.id}
          extra={batch ? { batch } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

/* ---------------- Costs ---------------- */

export function ExpenseRows({ items, showBatch, onOpen }: { items: Expense[]; showBatch: boolean; onOpen?: (e: Expense) => void }) {
  return (
    <ul className="space-y-2">
      {items.map((e) => (
        <li key={e.id}>
          <div
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onClick={() => onOpen?.(e)}
            onKeyDown={(k) => k.key === "Enter" && onOpen?.(e)}
            className={cn("glass rounded-xl p-3 flex gap-3 items-center", onOpen && "cursor-pointer hover:border-amber-500/40")}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {e.category_label}
                {e.description && <span className="font-normal text-foreground/70"> · {e.description}</span>}
              </p>
              <p className="text-xs text-foreground/50 truncate">
                {shortDate(e.date)}
                {showBatch && ` · ${e.batch_code ?? "All batches"}`}
                {e.quantity && ` · ${num(e.quantity)} ${e.unit}`}
                {e.paid_to && ` · ${e.paid_to}`}
                {who(e.created_by)}
              </p>
            </div>
            {e.receipt_url && (
              <a
                href={e.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => ev.stopPropagation()}
                className="h-9 w-9 rounded-lg glass inline-flex items-center justify-center text-foreground/60 hover:text-amber-600 flex-shrink-0"
                aria-label="Open receipt"
                title="Open receipt"
              >
                {isPdf(e.receipt_url) ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
              </a>
            )}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold tabular-nums">{tzs(e.amount)}</p>
              {e.payment_method === "credit" && <p className="text-[11px] font-semibold text-red-600">Not paid yet</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ExpenseList({ batch }: { batch: number }) {
  const { can } = usePermissions()
  const { data, isLoading, isError, refetch } = useExpenses({ batch: String(batch) })
  const [editing, setEditing] = useState<Expense | "new" | null>(null)
  const manage = can("cp_costs.manage")
  const fields = expenseFields(false)
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-foreground/60">{data ? <>Total <span className="font-semibold text-foreground">{tzs(data.total)}</span></> : null}</p>
        {manage && (
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            Add cost
          </button>
        )}
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState title="No costs for this batch yet" text="Feed, medicine, charcoal, transport... each with its receipt." />
      ) : (
        <ExpenseRows items={data.results} showBatch={false} onOpen={manage ? setEditing : undefined} />
      )}
      {editing && (
        <FarmSheet
          resource="expenses"
          title={editing === "new" ? "Add a cost" : "Edit cost"}
          fields={fields}
          initial={editing === "new" ? expenseDefaults() : toValues(fields, editing as unknown as Values)}
          recordId={editing === "new" ? undefined : editing.id}
          extra={{ batch }}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

/* ---------------- Sales ---------------- */

function PaymentsSheet({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { toast } = useToast()
  const { can } = usePermissions()
  const pay = useSalePayment()
  const remove = useDeleteSalePayment()
  const [current, setCurrent] = useState(sale)
  const [values, setValues] = useState<Values>({ amount: Number(sale.balance) || "", date: today(), method: "cash" })
  const manage = can("cp_sales.manage")
  const settled = Number(current.balance) <= 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    pay.mutate(
      { sale: sale.id, data: toBody(paymentFields, values) },
      {
        onSuccess: (updated) => {
          setCurrent(updated)
          setValues({ amount: Number(updated.balance) || "", date: today(), method: "cash" })
          toast({ title: "Payment recorded ✅" })
        },
        onError: (error) => toast({ variant: "destructive", title: "Could not record", description: validationMessage(error) ?? errorMessage(error, "Please try again.") }),
      },
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5 text-left">
          <SheetTitle>Payments from {current.buyer}</SheetTitle>
        </SheetHeader>
        <div className="glass rounded-2xl p-4 grid grid-cols-3 gap-2 text-center mb-5">
          <div>
            <p className="text-xs text-foreground/55">Total</p>
            <p className="font-semibold tabular-nums">{tzs(current.total)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/55">Paid</p>
            <p className="font-semibold tabular-nums text-emerald-600">{tzs(current.paid)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/55">Balance</p>
            <p className={cn("font-semibold tabular-nums", !settled && "text-red-600")}>{tzs(current.balance)}</p>
          </div>
        </div>
        {current.payments.length > 0 && (
          <ul className="space-y-2 mb-6">
            {current.payments.map((p) => (
              <li key={p.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium tabular-nums">{tzs(p.amount)}</p>
                  <p className="text-xs text-foreground/50">
                    {shortDate(p.date)} · {PAYMENT_METHODS[p.method]}
                    {p.reference && ` · ${p.reference}`}
                  </p>
                </div>
                {manage && (
                  <button
                    type="button"
                    aria-label="Remove payment"
                    onClick={() =>
                      remove.mutate(
                        { sale: sale.id, payment: p.id },
                        { onSuccess: (updated) => setCurrent(updated), onError: (error) => toast({ variant: "destructive", title: errorMessage(error, "Could not remove") }) },
                      )
                    }
                    className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {manage && !settled && (
          <form onSubmit={submit} className="glass rounded-2xl p-4">
            <p className="font-semibold mb-3">Record a payment</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentFields.map((f) => (
                <label key={f.name} className="block">
                  <span className="block text-sm font-medium mb-1.5">{f.label}</span>
                  {f.type === "select" ? (
                    <select value={String(values[f.name] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15">
                      {Object.entries(f.options).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      required={f.required}
                      inputMode={f.type === "number" ? "decimal" : undefined}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15"
                    />
                  )}
                </label>
              ))}
            </div>
            <button type="submit" disabled={pay.isPending} className={cn(farmButton, "w-full mt-4")}>
              {pay.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record payment
            </button>
          </form>
        )}
        {settled && <p className="text-center text-sm font-semibold text-emerald-600">Fully paid ✅</p>}
      </SheetContent>
    </Sheet>
  )
}

export function SaleRows({ items, showBatch, onEdit, onPay }: { items: Sale[]; showBatch: boolean; onEdit?: (s: Sale) => void; onPay: (s: Sale) => void }) {
  return (
    <ul className="space-y-2">
      {items.map((s) => {
        const owes = Number(s.balance) > 0
        return (
          <li key={s.id} className="glass rounded-xl p-3 flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <button type="button" disabled={!onEdit} onClick={() => onEdit?.(s)} className="min-w-0 flex-1 text-left enabled:hover:text-amber-700">
              <p className="text-sm font-medium truncate">
                {s.buyer}
                {s.customer_kind && <span className="font-normal text-foreground/55"> · {CUSTOMER_KINDS[s.customer_kind]}</span>}
              </p>
              <p className="text-xs text-foreground/50 truncate">
                {shortDate(s.date)}
                {showBatch && ` · ${s.batch_code}`} · {num(s.birds)} birds
                {s.weight_kg && ` · ${num(s.weight_kg)} kg`} · {tzs(s.unit_price)} {s.pricing === "per_kg" ? "/kg" : "/bird"}
              </p>
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{tzs(s.total)}</p>
              <p className={cn("text-[11px] font-semibold", owes ? "text-red-600" : "text-emerald-600")}>{owes ? `Owes ${tzs(s.balance)}` : "Paid"}</p>
            </div>
            <button type="button" onClick={() => onPay(s)} className={buttonGhost}>
              Payments
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function SaleList({ batch, params = {}, showAdd = true }: { batch?: number; params?: Record<string, string>; showAdd?: boolean }) {
  const { can } = usePermissions()
  const { data, isLoading, isError, refetch } = useSales(batch ? { ...params, batch: String(batch) } : params)
  const [editing, setEditing] = useState<Sale | "new" | null>(null)
  const [paying, setPaying] = useState<Sale | null>(null)
  const manage = can("cp_sales.manage")
  const isNew = editing === "new"
  const fields = saleFields(isNew, !batch)
  return (
    <section>
      {manage && showAdd && (
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            Record a sale
          </button>
        </div>
      )}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="No sales yet" />
      ) : (
        <SaleRows items={data} showBatch={!batch} onEdit={manage ? setEditing : undefined} onPay={setPaying} />
      )}
      {editing && (
        <FarmSheet
          resource="sales"
          title={isNew ? "Record a sale" : `Sale to ${(editing as Sale).buyer}`}
          fields={fields}
          initial={isNew ? saleDefaults() : toValues(fields, editing as unknown as Values)}
          recordId={isNew ? undefined : (editing as Sale).id}
          extra={batch ? { batch } : undefined}
          onClose={() => setEditing(null)}
          deleteText="The sale and its payments will be removed; the birds count as alive again."
          preview={(v) => (
            <p className="mt-5 glass rounded-xl p-3 text-sm flex justify-between">
              <span className="text-foreground/60">Total</span>
              <span className="font-bold tabular-nums">{tzs(saleTotal(v))}</span>
            </p>
          )}
        />
      )}
      {paying && <PaymentsSheet sale={paying} onClose={() => setPaying(null)} />}
    </section>
  )
}
