import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Printer } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost } from "@/features/dashboard/styles"
import { farmButton } from "./form"

/**
 * A plain page meant for paper (or "Save as PDF"): the dashboard around it is hidden when printing.
 */
export function PrintPage({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate()
  const { user } = usePermissions()
  const printed = new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
  return (
    <div className="print:text-black">
      <div className="flex flex-wrap gap-2 justify-between mb-6 print:hidden">
        <button type="button" onClick={() => navigate(-1)} className={buttonGhost}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button type="button" onClick={() => window.print()} className={farmButton}>
          <Printer className="h-4 w-4" />
          Print or save as PDF
        </button>
      </div>
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-8 print:border-0 print:p-0 print:rounded-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-amber-500 pb-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Chicken Point</p>
            <h1 className="text-2xl font-bold font-poppins">{title}</h1>
            {subtitle && <div className="text-sm text-slate-600 mt-1">{subtitle}</div>}
          </div>
          <p className="text-xs text-slate-500 text-right">
            Printed {printed}
            {user?.name && (
              <>
                <br />
                by {user.name}
              </>
            )}
          </p>
        </header>
        {children}
      </div>
    </div>
  )
}

export const th = "py-2 px-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-300"
export const td = "py-1.5 px-2 border-b border-slate-100 align-top"
