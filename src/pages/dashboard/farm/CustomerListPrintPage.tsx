import { useSearchParams } from "react-router-dom"
import { ErrorState, ListSkeleton } from "@/features/dashboard/ui"
import { useCustomerList } from "@/features/farm/api"
import { PrintPage, td, th } from "@/features/farm/PrintPage"
import { CUSTOMER_KINDS, SEGMENT_HELP, prettyPhone, shortDate, tzs, type Segment } from "@/features/farm/types"

export default function CustomerListPrintPage() {
  const [search] = useSearchParams()
  const params = Object.fromEntries(search.entries())
  const { data, isLoading, isError, refetch } = useCustomerList(params)
  if (isLoading) return <ListSkeleton rows={4} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />
  const customers = data.results
  const what = [params.segment ? SEGMENT_HELP[params.segment as Segment] : "", params.owes ? "Owing money" : "", params.q ? `Search: “${params.q}”` : ""].filter(Boolean).join(" · ")
  return (
    <PrintPage title="Customer list" subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"}${what ? ` · ${what}` : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Phone</th>
              <th className={th}>Contact · place</th>
              <th className={th}>Last bought</th>
              <th className={`${th} text-right`}>Purchases</th>
              <th className={`${th} text-right`}>Owes (TZS)</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {customers.map((c) => (
              <tr key={c.id} className="break-inside-avoid">
                <td className={td}>
                  <span className="font-semibold">{c.name}</span>
                  <br />
                  <span className="text-xs text-slate-500">
                    {CUSTOMER_KINDS[c.kind]} · {c.is_active ? c.stats.segment_label : "No longer buying"}
                  </span>
                </td>
                <td className={td}>
                  {prettyPhone(c.phone) || "—"}
                  {c.phone2 && (
                    <>
                      <br />
                      <span className="text-xs text-slate-500">{prettyPhone(c.phone2)}</span>
                    </>
                  )}
                </td>
                <td className={td}>{[c.contact_person, c.location].filter(Boolean).join(" · ") || "—"}</td>
                <td className={td}>{c.stats.last_purchase ? shortDate(c.stats.last_purchase) : "—"}</td>
                <td className={`${td} text-right`}>{c.stats.purchases}</td>
                <td className={`${td} text-right font-semibold`}>{Number(c.stats.owes) > 0 ? tzs(c.stats.owes).replace("TZS ", "") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintPage>
  )
}
