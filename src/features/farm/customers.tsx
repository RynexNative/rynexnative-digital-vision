import { useState } from "react"
import { Link } from "react-router-dom"
import { Check, Copy, MessageCircle, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pill } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CUSTOMER_KINDS, SEGMENT_STYLE, daysAgo, intlPhone, localPhone, shortDate, tzs, waLink, type Customer } from "./types"
import { FARM } from "./ui"

/** Call and WhatsApp in one tap */
export function ContactButtons({ customer, compact }: { customer: Pick<Customer, "name" | "phone" | "whatsapp">; compact?: boolean }) {
  const wa = customer.whatsapp || customer.phone
  if (!customer.phone && !wa) return null
  return (
    <div className="flex gap-2">
      {customer.phone && (
        <a href={`tel:${intlPhone(customer.phone)}`} className={buttonGhost} aria-label={`Call ${customer.name}`}>
          <Phone className="h-4 w-4" />
          {!compact && "Call"}
        </a>
      )}
      {wa && (
        <a href={waLink(wa, `Habari ${customer.name}, `)} target="_blank" rel="noopener noreferrer" className={buttonGhost} aria-label={`WhatsApp ${customer.name}`}>
          <MessageCircle className="h-4 w-4" />
          {!compact && "WhatsApp"}
        </a>
      )}
    </div>
  )
}

export function CustomerCard({ customer }: { customer: Customer }) {
  const st = customer.stats
  const owes = Number(st.owes)
  return (
    <li className={cn("glass rounded-2xl p-4 flex flex-col", !customer.is_active && "opacity-60")}>
      <Link to={`${FARM}/customers/${customer.id}`} className="block hover:text-amber-700 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold truncate">{customer.name}</p>
          <Pill className={SEGMENT_STYLE[st.segment]}>{customer.is_active ? st.segment_label : "No longer buying"}</Pill>
        </div>
        <p className="text-xs text-foreground/55 truncate">{[CUSTOMER_KINDS[customer.kind], customer.contact_person, customer.location].filter(Boolean).join(" · ")}</p>
      </Link>
      <div className="mt-3 text-sm space-y-0.5">
        <p className="text-foreground/75">
          {st.purchases ? (
            <>
              Last bought <span className="font-medium text-foreground">{daysAgo(st.days_since)}</span>
              {st.usual_gap_days ? ` · usually every ${st.usual_gap_days} days` : ""}
            </>
          ) : (
            "Nothing bought yet"
          )}
        </p>
        {st.next_expected && st.segment !== "quiet" && <p className="text-xs text-foreground/55">Likely to buy again around {shortDate(st.next_expected)}</p>}
        <p className="text-xs text-foreground/55">
          {st.purchases} purchase{st.purchases === 1 ? "" : "s"} · {tzs(st.bought)}
          {st.open_orders > 0 && ` · ${st.open_orders} open order${st.open_orders === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="mt-auto pt-3 flex items-end justify-between gap-2">
        <div className="text-xs font-semibold">
          {owes > 0 && <p className="text-red-600">Owes {tzs(owes)}</p>}
          {owes < 0 && <p className="text-amber-700">We owe them {tzs(-owes)}</p>}
          {Number(st.deposits_held) > 0 && <p className="text-sky-700">Deposit held {tzs(st.deposits_held)}</p>}
        </div>
        <ContactButtons customer={customer} compact />
      </div>
    </li>
  )
}

/** Every number in the list, ready to paste into a WhatsApp broadcast, bulk SMS or a spreadsheet. */
export function CopyNumbersDialog({ customers, onClose }: { customers: Customer[]; onClose: () => void }) {
  const { toast } = useToast()
  const [style, setStyle] = useState<"local" | "intl">("local")
  const [joiner, setJoiner] = useState<"lines" | "commas">("lines")
  const [withNames, setWithNames] = useState(false)
  const [copied, setCopied] = useState(false)
  const seen = new Set<string>()
  const rows: string[] = []
  for (const c of customers) {
    for (const raw of [c.phone, c.phone2]) {
      const number = style === "local" ? localPhone(raw) : intlPhone(raw)
      if (!number || seen.has(number)) continue
      seen.add(number)
      rows.push(withNames && joiner === "lines" ? `${c.name}: ${number}` : number)
    }
  }
  const text = rows.join(joiner === "lines" ? "\n" : ", ")
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: `${rows.length} numbers copied` })
    } catch {
      toast({ variant: "destructive", title: "Could not copy", description: "Select the numbers and copy them by hand." })
    }
  }
  const chip = (on: boolean) => cn("h-9 px-3 rounded-lg border text-sm", on ? "bg-amber-500 text-white border-amber-500" : "border-foreground/15 hover:border-amber-500/50")
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy phone numbers</DialogTitle>
          <DialogDescription>
            {rows.length} number{rows.length === 1 ? "" : "s"} from the customers listed. Paste them into a WhatsApp broadcast list, a bulk SMS service or a spreadsheet.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(style === "local")} onClick={() => setStyle("local")}>
            0712 345 678
          </button>
          <button type="button" className={chip(style === "intl")} onClick={() => setStyle("intl")}>
            +255 712 345 678
          </button>
          <button type="button" className={chip(joiner === "lines")} onClick={() => setJoiner("lines")}>
            One per line
          </button>
          <button type="button" className={chip(joiner === "commas")} onClick={() => setJoiner("commas")}>
            Separated by commas
          </button>
          {joiner === "lines" && (
            <button type="button" className={chip(withNames)} onClick={() => setWithNames(!withNames)}>
              With names
            </button>
          )}
        </div>
        <textarea readOnly value={text} rows={8} className="w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15 text-sm font-mono" onFocus={(e) => e.target.select()} aria-label="Phone numbers" />
        <button type="button" onClick={copy} disabled={!rows.length} className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy all"}
        </button>
      </DialogContent>
    </Dialog>
  )
}
