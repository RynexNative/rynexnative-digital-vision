import { useParams } from "react-router-dom"
import { ErrorState, ListSkeleton } from "@/features/dashboard/ui"
import { useCustomer, useOrders, useSales } from "@/features/farm/api"
import { PrintPage, td, th } from "@/features/farm/PrintPage"
import { CUSTOMER_KINDS, ORDER_STATUS, PAYMENT_METHODS, prettyPhone, num, shortDate, tzs } from "@/features/farm/types"

const money = (n: string | number) => tzs(n).replace("TZS ", "")

/** Everything bought, paid and owed: to give to the customer or keep on file. */
export default function CustomerStatementPage() {
  const { id = "" } = useParams()
  const { data: c, isLoading, isError, refetch } = useCustomer(id)
  const { data: sales = [] } = useSales({ customer: id })
  const { data: orders = [] } = useOrders({ customer: id })
  if (isLoading) return <ListSkeleton rows={4} />
  if (isError || !c) return <ErrorState onRetry={() => refetch()} />
  const owes = Number(c.stats.owes)
  const payments = sales
    .flatMap((s) => s.payments.map((p) => ({ ...p, sale: s })))
    .concat(orders.filter((o) => !o.sale).flatMap((o) => o.payments.map((p) => ({ ...p, sale: null }))))
    .sort((a, b) => a.date.localeCompare(b.date))
  const sortedSales = [...sales].sort((a, b) => a.date.localeCompare(b.date))
  const openOrders = orders.filter((o) => o.status === "open" || o.status === "ready")

  return (
    <PrintPage
      title="Customer statement"
      subtitle={
        <>
          <span className="font-semibold text-slate-900">{c.name}</span> · {CUSTOMER_KINDS[c.kind]}
          {c.contact_person && ` · ${c.contact_person}`}
          {c.phone && ` · ${prettyPhone(c.phone)}`}
          {c.location && ` · ${c.location}`}
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-sm">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Bought</p>
          <p className="font-bold tabular-nums">{tzs(c.stats.bought)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="font-bold tabular-nums">{tzs(c.stats.paid)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">{owes < 0 ? "Owed to the customer" : "Balance due"}</p>
          <p className="font-bold tabular-nums">{tzs(Math.abs(owes))}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Deposits on open orders</p>
          <p className="font-bold tabular-nums">{tzs(c.stats.deposits_held)}</p>
        </div>
      </div>

      <h2 className="font-semibold mb-2">Purchases</h2>
      {sortedSales.length === 0 ? (
        <p className="text-sm text-slate-500 mb-6">No purchases.</p>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Batch</th>
                <th className={`${th} text-right`}>Birds</th>
                <th className={`${th} text-right`}>Kg</th>
                <th className={`${th} text-right`}>Price</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-right`}>Paid</th>
                <th className={`${th} text-right`}>Balance</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {sortedSales.map((s) => (
                <tr key={s.id} className="break-inside-avoid">
                  <td className={td}>{shortDate(s.date)}</td>
                  <td className={td}>{s.batch_code}</td>
                  <td className={`${td} text-right`}>{num(s.birds)}</td>
                  <td className={`${td} text-right`}>{s.weight_kg ? num(s.weight_kg) : "—"}</td>
                  <td className={`${td} text-right`}>
                    {money(s.unit_price)}
                    {s.pricing === "per_kg" ? "/kg" : "/bird"}
                  </td>
                  <td className={`${td} text-right`}>{money(s.total)}</td>
                  <td className={`${td} text-right`}>{money(s.paid)}</td>
                  <td className={`${td} text-right font-semibold`}>{money(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-semibold mb-2">Payments and refunds</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-slate-500 mb-6">No payments.</p>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Date</th>
                <th className={th}>For</th>
                <th className={th}>By</th>
                <th className={th}>Reference</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {payments.map((p) => (
                <tr key={p.id} className="break-inside-avoid">
                  <td className={td}>{shortDate(p.date)}</td>
                  <td className={td}>
                    {p.kind === "refund" ? "Refund · " : ""}
                    {p.from_order ? `Deposit on order #${p.from_order}${p.sale ? ` (delivered ${shortDate(p.sale.date)})` : ""}` : p.sale ? `Sale of ${shortDate(p.sale.date)}` : ""}
                  </td>
                  <td className={td}>{PAYMENT_METHODS[p.method]}</td>
                  <td className={td}>{p.reference || "—"}</td>
                  <td className={`${td} text-right`}>{p.kind === "refund" ? `−${money(p.amount)}` : money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openOrders.length > 0 && (
        <>
          <h2 className="font-semibold mb-2">Orders not delivered yet</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Ordered</th>
                  <th className={th}>Wanted</th>
                  <th className={`${th} text-right`}>Birds</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Deposit paid</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {openOrders.map((o) => (
                  <tr key={o.id}>
                    <td className={td}>{shortDate(o.ordered_on)}</td>
                    <td className={td}>{o.wanted_on ? shortDate(o.wanted_on) : "—"}</td>
                    <td className={`${td} text-right`}>{num(o.birds)}</td>
                    <td className={td}>{ORDER_STATUS[o.status].label}</td>
                    <td className={`${td} text-right`}>{money(o.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-slate-500">Amounts in Tanzanian shillings (TZS). Thank you for buying from Chicken Point.</p>
    </PrintPage>
  )
}
