import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { usePermissions } from "@/features/dashboard/access"
import { Pill } from "@/features/dashboard/ui"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useDeletePayment, usePayment, type PaidThing } from "./api"
import { farmButton } from "./form"
import { ReasonDialog } from "./ReasonDialog"
import { PAYMENT_METHODS, shortDate, today, tzs, type Order, type Sale, type SalePayment } from "./types"

const RECEIVED = { cash: "Cash", mobile: "Mobile money", bank: "Bank" }
const field = "w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15"

/** What a sale or an order says about its money */
function position(target: PaidThing, thing: Sale | Order) {
  if (target === "sales") {
    const sale = thing as Sale
    const balance = Number(sale.balance)
    return { total: sale.total as string | null, paid: sale.paid, balance, closed: false, refundsOnly: false, note: "" }
  }
  const order = thing as Order
  const balance = order.to_pay === null ? 0 : Number(order.to_pay)
  if (order.status === "delivered") return { total: order.expected_total, paid: order.paid, balance, closed: true, refundsOnly: false, note: "Delivered: its deposits now count on the sale." }
  if (order.status === "cancelled")
    return { total: order.expected_total, paid: order.paid, balance: -Number(order.paid), closed: false, refundsOnly: true, note: "Cancelled: give back what was paid, then record the refund here." }
  return { total: order.expected_total, paid: order.paid, balance, closed: false, refundsOnly: false, note: order.expected_total ? "" : "No price agreed yet: any deposit can be recorded." }
}

/**
 * Money in (and refunds) for a sale or an order. Removing a payment asks why and keeps it
 * under Deleted items; nothing is lost.
 */
export function PaymentsSheet<T extends Sale | Order>({ target, thing, onClose }: { target: PaidThing; thing: T; onClose: () => void }) {
  const { toast } = useToast()
  const { can } = usePermissions()
  const pay = usePayment<T>(target)
  const remove = useDeletePayment<T>(target)
  const [current, setCurrent] = useState<T>(thing)
  const [removing, setRemoving] = useState<SalePayment | null>(null)
  const now = position(target, current)
  const credit = now.balance < 0
  const fresh = (p = position(target, current)) => ({
    kind: p.refundsOnly || p.balance < 0 ? "refund" : "payment",
    amount: p.balance > 0 ? String(p.balance) : p.balance < 0 ? String(-p.balance) : "",
    date: today(),
    method: "cash",
    reference: "",
  })
  const [values, setValues] = useState(fresh)
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }))
  const manage = can("cp_sales.manage")
  const settled = !now.refundsOnly && now.total !== null && now.balance === 0
  const canRecord = manage && !now.closed && !(settled && Number(now.paid) <= 0 && !credit)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    pay.mutate(
      { id: thing.id, data: { ...values, amount: Number(values.amount) } },
      {
        onSuccess: (updated) => {
          setCurrent(updated)
          setValues(fresh(position(target, updated)))
          toast({ title: values.kind === "refund" ? "Refund recorded ✅" : "Payment recorded ✅" })
        },
        onError: (error) => toast({ variant: "destructive", title: "Not recorded", description: serverMessage(error, "Please try again.") }),
      },
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5 text-left">
          <SheetTitle>
            {target === "orders" ? "Deposits" : "Payments"} · {current.buyer}
          </SheetTitle>
          {now.note && <SheetDescription>{now.note}</SheetDescription>}
        </SheetHeader>
        <div className="glass rounded-2xl p-4 grid grid-cols-3 gap-2 text-center mb-5">
          <div>
            <p className="text-xs text-foreground/55">{target === "orders" ? "Expected" : "Total"}</p>
            <p className="font-semibold tabular-nums">{now.total === null ? "No price yet" : tzs(now.total)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/55">Paid</p>
            <p className="font-semibold tabular-nums text-emerald-600">{tzs(now.paid)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/55">{credit ? "We owe them" : "Balance"}</p>
            <p className={cn("font-semibold tabular-nums", (now.balance > 0 || credit) && "text-red-600")}>{now.total === null && !credit ? "—" : tzs(Math.abs(now.balance))}</p>
          </div>
        </div>
        {credit && (
          <p className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {current.buyer} paid {tzs(-now.balance)} more than {target === "orders" ? "they now owe" : "this sale"}. Give it back and record the refund below.
          </p>
        )}
        {current.payments.length > 0 ? (
          <ul className="space-y-2 mb-6">
            {current.payments.map((p) => (
              <li key={p.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium tabular-nums flex items-center gap-2 flex-wrap">
                    {p.kind === "refund" ? `− ${tzs(p.amount)}` : tzs(p.amount)}
                    {p.kind === "refund" && <Pill className="bg-red-500/10 text-red-700 border-red-500/30">Refund</Pill>}
                    {p.from_order && target === "sales" && <Pill className="bg-sky-500/10 text-sky-700 border-sky-500/30">Deposit on order #{p.from_order}</Pill>}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {shortDate(p.date)} · {PAYMENT_METHODS[p.method]}
                    {p.reference && ` · ${p.reference}`}
                    {p.created_by && ` · by ${p.created_by.name}`}
                  </p>
                </div>
                {manage && !now.closed && (
                  <button
                    type="button"
                    aria-label="Remove payment"
                    onClick={() => setRemoving(p)}
                    className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/55 mb-6">Nothing paid yet.</p>
        )}
        {canRecord && (settled ? null : (
          <form onSubmit={submit} className="glass rounded-2xl p-4">
            <p className="font-semibold mb-3">{values.kind === "refund" ? "Record a refund (money given back)" : target === "orders" ? "Record a deposit" : "Record a payment"}</p>
            <div className="grid grid-cols-2 gap-3">
              {!now.refundsOnly && (
                <label className="block col-span-2">
                  <span className="block text-sm font-medium mb-1.5">What</span>
                  <select value={values.kind} onChange={(e) => set("kind", e.target.value)} className={field}>
                    <option value="payment">Money received from the customer</option>
                    <option value="refund">Refund: money given back to the customer</option>
                  </select>
                </label>
              )}
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Amount (TZS) *</span>
                <input required type="number" min={1} step="any" inputMode="decimal" value={values.amount} onChange={(e) => set("amount", e.target.value)} className={field} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Date *</span>
                <input required type="date" value={values.date} onChange={(e) => set("date", e.target.value)} className={field} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">By</span>
                <select value={values.method} onChange={(e) => set("method", e.target.value)} className={field}>
                  {Object.entries(RECEIVED).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Reference</span>
                <input value={values.reference} onChange={(e) => set("reference", e.target.value)} placeholder="M-Pesa code, bank ref..." className={field} />
              </label>
            </div>
            <button type="submit" disabled={pay.isPending} className={cn(farmButton, "w-full mt-4")}>
              {pay.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {values.kind === "refund" ? "Record refund" : "Record payment"}
            </button>
          </form>
        ))}
        {settled && <p className="text-center text-sm font-semibold text-emerald-600">Fully paid ✅</p>}
        {removing && (
          <ReasonDialog
            title={removing.kind === "refund" ? "Remove this refund?" : "Remove this payment?"}
            description={
              removing.kind === "refund"
                ? "The refund will no longer count. Only do this if it was recorded by mistake."
                : `${current.buyer} will owe this amount again, and the money received will drop. Only do this if the payment was a mistake or never arrived.`
            }
            details={
              <>
                <p className="font-semibold tabular-nums">{tzs(removing.amount)}</p>
                <p className="text-foreground/60">
                  {shortDate(removing.date)} · {PAYMENT_METHODS[removing.method]}
                  {removing.reference && ` · ${removing.reference}`}
                </p>
              </>
            }
            confirmLabel={removing.kind === "refund" ? "Remove refund" : "Remove payment"}
            keepLabel="Keep it"
            placeholder="e.g. Recorded twice by mistake; the M-Pesa payment was reversed"
            pending={remove.isPending}
            onClose={() => setRemoving(null)}
            onConfirm={(reason) =>
              remove.mutate(
                { id: thing.id, payment: removing.id, reason },
                {
                  onSuccess: (updated) => {
                    toast({ title: "Removed", description: "Kept under Deleted items with your reason." })
                    setCurrent(updated)
                    setValues(fresh(position(target, updated)))
                    setRemoving(null)
                  },
                  onError: (error) => toast({ variant: "destructive", title: "Not removed", description: serverMessage(error, "Please try again.") }),
                },
              )
            }
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
