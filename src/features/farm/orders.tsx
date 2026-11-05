import { useState } from "react"
import { CalendarClock, CheckCircle2, Phone, Plus, Truck, XCircle } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost } from "@/features/dashboard/styles"
import { EmptyState, ErrorState, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useOrderAction, useOrders, useSaveFarm } from "./api"
import { FarmSheet } from "./FarmSheet"
import { farmButton, toValues, type FarmField, type Values } from "./form"
import { orderDefaults, orderFields, saleTotal } from "./fields"
import { PaymentsSheet } from "./PaymentsSheet"
import { ReasonDialog } from "./ReasonDialog"
import { CUSTOMER_KINDS, ORDER_STATUS, num, shortDate, today, tzs, waLink, type Order } from "./types"

function dueText(order: Order) {
  if (!order.wanted_on || order.status === "delivered" || order.status === "cancelled") return null
  const days = Math.round((new Date(`${order.wanted_on}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86_400_000)
  if (days < 0) return { text: `${-days} day${days === -1 ? "" : "s"} late`, late: true }
  if (days === 0) return { text: "Wanted today", late: true }
  return { text: `In ${days} day${days === 1 ? "" : "s"}`, late: false }
}

/** How much of the order is paid, at a glance */
export function DepositStatus({ order }: { order: Order }) {
  const paid = Number(order.paid)
  if (order.status === "delivered") {
    return <p className="text-[11px] text-foreground/55">{paid > 0 ? `Deposits of ${tzs(paid)} counted on the sale` : "Paid on the sale"}</p>
  }
  if (order.status === "cancelled") {
    return paid > 0 ? <p className="text-[11px] font-semibold text-red-600">To refund {tzs(paid)}</p> : <p className="text-[11px] text-foreground/50">Nothing held</p>
  }
  if (paid <= 0) return <p className="text-[11px] font-semibold text-foreground/55">No deposit yet</p>
  if (order.expected_total === null) return <p className="text-[11px] font-semibold text-sky-700">Deposit {tzs(paid)}</p>
  const left = Number(order.to_pay)
  return left <= 0 ? (
    <p className="text-[11px] font-semibold text-emerald-600">Paid in full ({tzs(paid)})</p>
  ) : (
    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
      Paid {tzs(paid)} · {tzs(left)} left
    </p>
  )
}

const deliverFields: FarmField[] = [
  { name: "batch", label: "From batch", type: "batch", required: true, wide: true },
  { name: "date", label: "Delivered on", type: "date", required: true },
  { name: "birds", label: "Birds delivered", type: "number", step: "1", required: true },
  { name: "pricing", label: "Sold by", type: "select", options: { per_kg: "Per kg", per_bird: "Per bird" } },
  { name: "weight_kg", label: "Total weight (kg)", type: "number", required: true, showIf: (v) => v.pricing === "per_kg" },
  { name: "unit_price", label: "Price (TZS)", type: "number", required: true, hint: "Per kg or per bird" },
]

/** Delivering: the sale is written from the order, the deposits count as its payments. */
function DeliverSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast()
  const act = useOrderAction()
  const initial: Values = {
    batch: order.batch ?? "",
    date: today(),
    birds: order.birds,
    pricing: order.pricing,
    weight_kg: order.est_weight_kg ?? "",
    unit_price: order.unit_price ?? "",
  }
  // FarmSheet saves through the order's "deliver" step instead of a plain save
  return (
    <FarmSheet
      resource="orders"
      title={`Deliver to ${order.buyer}`}
      description={`Creates the sale. ${Number(order.paid) > 0 ? `The ${tzs(order.paid)} already paid counts towards it.` : "Nothing was paid in advance."}`}
      fields={deliverFields}
      initial={initial}
      onClose={onClose}
      submitLabel="Deliver"
      onSubmit={(body) =>
        act.mutate(
          { id: order.id, action: "deliver", data: body },
          {
            onSuccess: (done) => {
              const balance = Number(done.sale_balance ?? 0)
              toast({
                title: "Delivered ✅",
                description: balance > 0 ? `${order.buyer} still owes ${tzs(balance)}.` : balance < 0 ? `${order.buyer} paid ${tzs(-balance)} too much: refund it on the sale.` : "Fully paid.",
              })
              onClose()
            },
            onError: (error) => toast({ variant: "destructive", title: "Not delivered", description: serverMessage(error, "Please try again.") }),
          },
        )
      }
      pending={act.isPending}
      preview={(v) => {
        const total = saleTotal(v)
        const left = total - Number(order.paid)
        return (
          <div className="mt-5 glass rounded-xl p-3 text-sm space-y-1">
            <p className="flex justify-between">
              <span className="text-foreground/60">Sale total</span>
              <span className="font-bold tabular-nums">{tzs(total)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-foreground/60">Already paid</span>
              <span className="tabular-nums">{tzs(order.paid)}</span>
            </p>
            <p className={cn("flex justify-between font-semibold", left < 0 && "text-red-600")}>
              <span>{left < 0 ? "To refund" : "Still to pay"}</span>
              <span className="tabular-nums">{tzs(Math.abs(left))}</span>
            </p>
          </div>
        )
      }}
    />
  )
}

export function OrderList({ customer, params = {}, showAdd = true }: { customer?: number; params?: Record<string, string>; showAdd?: boolean }) {
  const { can } = usePermissions()
  const { toast } = useToast()
  const query = customer ? { ...params, customer: String(customer) } : params
  const { data, isLoading, isError, refetch } = useOrders(query)
  const save = useSaveFarm<Order>("orders")
  const act = useOrderAction()
  const [editing, setEditing] = useState<Order | "new" | null>(null)
  const [paying, setPaying] = useState<Order | null>(null)
  const [delivering, setDelivering] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState<Order | null>(null)
  const manage = can("cp_sales.manage")
  const isNew = editing === "new"
  const fields = orderFields(isNew, !customer)

  return (
    <section>
      {manage && showAdd && (
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            New order
          </button>
        </div>
      )}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="No orders" text="Customers who book birds ahead (and pay a deposit) show up here." />
      ) : (
        <ul className="space-y-2">
          {data.map((o) => {
            const due = dueText(o)
            const open = o.status === "open" || o.status === "ready"
            return (
              <li key={o.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <button type="button" disabled={!manage || !open} onClick={() => setEditing(o)} className="min-w-0 flex-1 text-left enabled:hover:text-amber-700">
                    <p className="font-semibold flex flex-wrap items-center gap-2">
                      {o.buyer}
                      {o.customer_kind && <span className="text-xs font-normal text-foreground/55">{CUSTOMER_KINDS[o.customer_kind]}</span>}
                      <Pill className={ORDER_STATUS[o.status].className}>{ORDER_STATUS[o.status].label}</Pill>
                    </p>
                    <p className="text-sm text-foreground/70 mt-0.5">
                      {num(o.birds)} birds
                      {o.unit_price && ` · ${tzs(o.unit_price)} ${o.pricing === "per_kg" ? "/kg" : "/bird"}`}
                      {o.batch_code && ` · ${o.batch_code}`}
                    </p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      Ordered {shortDate(o.ordered_on)}
                      {o.wanted_on && ` · wanted ${shortDate(o.wanted_on)}`}
                      {o.created_by && ` · by ${o.created_by.name}`}
                    </p>
                    {o.cancel_reason && <p className="text-xs text-foreground/60 mt-1">Cancelled: {o.cancel_reason}</p>}
                    {o.notes && <p className="text-xs text-foreground/60 mt-1">{o.notes}</p>}
                  </button>
                  <div className="text-right">
                    {due && (
                      <p className={cn("text-xs font-semibold inline-flex items-center gap-1", due.late ? "text-red-600" : "text-foreground/60")}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        {due.text}
                      </p>
                    )}
                    <DepositStatus order={o} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" onClick={() => setPaying(o)} className={buttonGhost}>
                    {o.status === "cancelled" ? "Refunds" : "Deposits"}
                  </button>
                  {o.phone && (
                    <a href={waLink(o.phone, `Habari ${o.buyer}, `)} target="_blank" rel="noopener noreferrer" className={buttonGhost}>
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  {manage && open && (
                    <>
                      {o.status === "open" && (
                        <button
                          type="button"
                          className={buttonGhost}
                          onClick={() =>
                            save.mutate(
                              { id: o.id, data: { status: "ready" } },
                              { onError: (error) => toast({ variant: "destructive", title: serverMessage(error, "Not changed") }) },
                            )
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark ready
                        </button>
                      )}
                      <button type="button" onClick={() => setDelivering(o)} className={cn(buttonGhost, "text-emerald-700")}>
                        <Truck className="h-4 w-4" />
                        Deliver
                      </button>
                      <button type="button" onClick={() => setCancelling(o)} className={cn(buttonGhost, "hover:text-red-600")}>
                        <XCircle className="h-4 w-4" />
                        Cancel order
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <FarmSheet
          resource="orders"
          title={isNew ? "New order" : `Order for ${(editing as Order).buyer}`}
          description="Birds booked ahead. A deposit (full or part) can be taken now or later."
          fields={fields}
          initial={isNew ? orderDefaults() : toValues(fields, editing as unknown as Values)}
          recordId={isNew ? undefined : (editing as Order).id}
          extra={customer ? { customer } : undefined}
          deleteText="Only an order with no deposit can be deleted (otherwise cancel it). It is kept under Deleted items."
          onClose={() => setEditing(null)}
        />
      )}
      {paying && <PaymentsSheet target="orders" thing={paying} onClose={() => setPaying(null)} />}
      {delivering && <DeliverSheet order={delivering} onClose={() => setDelivering(null)} />}
      {cancelling && (
        <ReasonDialog
          title="Cancel this order?"
          description={
            Number(cancelling.paid) > 0
              ? `${cancelling.buyer} paid ${tzs(cancelling.paid)}. The money stays on record as "to refund" until you record the refund.`
              : "The order stays on record as cancelled."
          }
          details={
            <p>
              {num(cancelling.birds)} birds for {cancelling.buyer}
              {cancelling.wanted_on && `, wanted ${shortDate(cancelling.wanted_on)}`}
            </p>
          }
          confirmLabel="Cancel order"
          keepLabel="Keep the order"
          placeholder="e.g. The hotel closed for renovation"
          pending={act.isPending}
          onClose={() => setCancelling(null)}
          onConfirm={(reason) =>
            act.mutate(
              { id: cancelling.id, action: "cancel", data: { reason } },
              {
                onSuccess: () => {
                  toast({ title: "Order cancelled" })
                  setCancelling(null)
                },
                onError: (error) => toast({ variant: "destructive", title: "Not cancelled", description: serverMessage(error, "Please try again.") }),
              },
            )
          }
        />
      )}
    </section>
  )
}
