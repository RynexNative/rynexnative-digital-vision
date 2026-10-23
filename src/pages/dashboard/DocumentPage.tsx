import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Ban, CheckCircle2, Download, Eye, Loader2, Mail, MessageCircle, Plus, Receipt, Save, Trash2, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import {
  openPdf,
  useAddPayment,
  useBusinessProfile,
  useDeleteDocument,
  useDeletePayment,
  useDocument,
  useDocumentAction,
  useSaveDocument,
  type DocumentInput,
} from "@/features/billing/api"
import {
  KIND_LABEL,
  PAYMENT_METHODS,
  STATE_LABEL,
  money,
  type BillingDocument,
  type DocumentItem,
  type DocumentKind,
  type DocumentStatus,
  type PaymentMethod,
} from "@/features/billing/types"
import { whatsappNumber } from "@/features/dashboard/types"
import { ErrorState, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useOpsList } from "@/features/operations/api"
import { formatDate, type OpsClient } from "@/features/operations/types"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Form = {
  client: string
  bill_to_name: string
  bill_to_company: string
  bill_to_phone: string
  bill_to_email: string
  bill_to_address: string
  title: string
  issue_date: string
  valid_until: string
  due_date: string
  currency: "TZS" | "USD"
  apply_vat: boolean
  vat_rate: string
  notes: string
  terms: string
}

const today = () => new Date().toLocaleDateString("en-CA") // YYYY-MM-DD in local time
const emptyItem = (): DocumentItem => ({
  description: "",
  details: "",
  quantity: "1",
  unit_price: "",
})

function fromDocument(doc: BillingDocument): Form {
  return {
    client: doc.client?.id ?? "",
    bill_to_name: doc.bill_to_name,
    bill_to_company: doc.bill_to_company,
    bill_to_phone: doc.bill_to_phone,
    bill_to_email: doc.bill_to_email,
    bill_to_address: doc.bill_to_address,
    title: doc.title,
    issue_date: doc.issue_date,
    valid_until: doc.valid_until ?? "",
    due_date: doc.due_date ?? "",
    currency: doc.currency,
    apply_vat: doc.apply_vat,
    vat_rate: doc.vat_rate,
    notes: doc.notes,
    terms: doc.terms,
  }
}

function Field({ label, children, wide, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return (
    <label className={cn("block", wide && "sm:col-span-2")}>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-foreground/50 mt-1">{hint}</span>}
    </label>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Payments({ doc }: { doc: BillingDocument }) {
  const { toast } = useToast()
  const add = useAddPayment()
  const remove = useDeletePayment()
  const balance = Math.max(0, Number(doc.balance))
  const [amount, setAmount] = useState(balance ? String(balance) : "")
  const [paidOn, setPaidOn] = useState(today())
  const [method, setMethod] = useState<PaymentMethod>("mobile_money")
  const [reference, setReference] = useState("")

  useEffect(() => {
    setAmount(balance ? String(balance) : "")
  }, [balance])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    add.mutate(
      {
        id: doc.id,
        data: {
          amount,
          paid_on: paidOn,
          method,
          reference: reference.trim(),
          notes: "",
        },
      },
      {
        onSuccess: (updated) => {
          setReference("")
          toast({
            title: updated.state === "paid" ? "Paid in full ✅" : "Payment recorded ✅",
          })
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "Could not record the payment",
            description: serverMessage(error, "Please try again."),
          }),
      },
    )
  }

  return (
    <Section
      title="Payments"
      action={
        <span className="text-sm">
          Paid <b>{money(doc.amount_paid, doc.currency)}</b> · Balance{" "}
          <b className={Number(doc.balance) > 0 ? "text-amber-700" : "text-emerald-700"}>{money(doc.balance, doc.currency)}</b>
        </span>
      }
    >
      {doc.payments.length > 0 && (
        <ul className="divide-y divide-border mb-4">
          {doc.payments.map((p) => (
            <li key={p.id} className="py-2.5 flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <b>{money(p.amount, doc.currency)}</b> · {formatDate(p.paid_on)} · {PAYMENT_METHODS[p.method]}
                {p.reference && <span className="text-foreground/55"> · {p.reference}</span>}
              </span>
              <button
                type="button"
                aria-label="Remove payment"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: doc.id, paymentId: p.id }, { onSuccess: () => toast({ title: "Payment removed" }) })}
                className="h-8 w-8 rounded-lg text-foreground/40 hover:text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {doc.state === "paid" ? null : doc.status === "void" ? (
        <p className="text-sm text-foreground/55">This invoice is void.</p>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
          <Field label={`Amount (${doc.currency})`}>
            <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date">
            <input required type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Method">
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference">
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID" className={inputClass} />
          </Field>
          <button type="submit" disabled={add.isPending} className={cn(buttonPrimary, "h-[46px]")}>
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Record
          </button>
        </form>
      )}
    </Section>
  )
}

export default function DocumentPage() {
  const { id: routeId } = useParams()
  const isNew = routeId === "new"
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: doc, isLoading, isError, refetch } = useDocument(isNew ? undefined : routeId)
  const { data: profile } = useBusinessProfile()
  const { data: clients = [] } = useOpsList<OpsClient>("clients")
  const save = useSaveDocument()
  const remove = useDeleteDocument()
  const convert = useDocumentAction("convert")
  const send = useDocumentAction("send")

  const kind: DocumentKind = doc?.kind ?? (searchParams.get("kind") === "invoice" ? "invoice" : "quote")
  const [form, setForm] = useState<Form | null>(null)
  const [items, setItems] = useState<DocumentItem[]>([emptyItem()])
  const [dirty, setDirty] = useState(false)
  const [sendTo, setSendTo] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  // Load the document (or sensible defaults for a new one) into the form
  useEffect(() => {
    if (doc) {
      setForm(fromDocument(doc))
      setItems(doc.items.length ? doc.items.map((i) => ({ ...i })) : [emptyItem()])
      setDirty(false)
    } else if (isNew && profile && !form) {
      const preset = searchParams.get("client") ?? ""
      setForm({
        client: preset,
        bill_to_name: "",
        bill_to_company: "",
        bill_to_phone: "",
        bill_to_email: "",
        bill_to_address: "",
        title: "",
        issue_date: today(),
        valid_until: "",
        due_date: "",
        currency: "TZS",
        apply_vat: profile.vat_by_default,
        vat_rate: profile.vat_rate,
        notes: "",
        terms: kind === "quote" ? profile.quote_terms : profile.invoice_terms,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, isNew, profile])

  const set = <K extends keyof Form>(name: K, value: Form[K]) => {
    setForm((f) => (f ? { ...f, [name]: value } : f))
    setDirty(true)
  }
  const setItem = (index: number, patch: Partial<DocumentItem>) => {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    setDirty(true)
  }

  const chooseClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setForm((f) => {
      if (!f) return f
      if (!client) return { ...f, client: "" }
      // Fill the "bill to" block from the client; the team can still edit it
      return {
        ...f,
        client: clientId,
        bill_to_name: client.contact_name || client.name,
        bill_to_company: client.contact_name && client.contact_name !== client.name ? client.name : "",
        bill_to_phone: client.phone,
        bill_to_email: client.email,
        bill_to_address: client.location,
      }
    })
    setDirty(true)
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
    const vat = form?.apply_vat ? (subtotal * (Number(form.vat_rate) || 0)) / 100 : 0
    return { subtotal, vat, total: subtotal + vat }
  }, [items, form?.apply_vat, form?.vat_rate])

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if ((!isNew && isLoading) || !form) return <ListSkeleton rows={3} />

  const payload = (): DocumentInput => ({
    ...(isNew ? { kind } : {}),
    ...form,
    client: form.client || null,
    valid_until: kind === "quote" ? form.valid_until || null : null,
    due_date: kind === "invoice" ? form.due_date || null : null,
    items: items
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description.trim(),
        details: i.details.trim(),
        quantity: i.quantity || "1",
        unit_price: i.unit_price || "0",
      })),
  })

  /** Saves if needed; resolves with the saved document */
  const persist = (): Promise<BillingDocument> =>
    new Promise((resolve, reject) => {
      if (!isNew && !dirty && doc) return resolve(doc)
      save.mutate(
        { id: isNew ? undefined : doc?.id, data: payload() },
        {
          onSuccess: (saved) => {
            setDirty(false)
            if (isNew) navigate(`/admin/billing/${saved.id}`, { replace: true })
            resolve(saved)
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Could not save",
              description: serverMessage(error, "Please try again."),
            })
            reject(null) // already reported
          },
        },
      )
    })

  const onSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    persist().then(
      () => toast({ title: "Saved ✅" }),
      () => {},
    )
  }

  const setStatus = (status: DocumentStatus, message: string) =>
    doc &&
    save.mutate(
      { id: doc.id, data: { status } },
      {
        onSuccess: () => toast({ title: message }),
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "Could not update",
            description: serverMessage(error, "Please try again."),
          }),
      },
    )

  const pdf = async (download: boolean) => {
    setPdfBusy(true)
    try {
      const saved = await persist()
      await openPdf(saved, download)
    } catch (error) {
      if (error)
        toast({
          variant: "destructive",
          title: "Could not open the PDF",
          description: serverMessage(error, "Please try again."),
        })
    } finally {
      setPdfBusy(false)
    }
  }

  const onConvert = () =>
    persist().then(
      (saved) =>
        convert.mutate(
          { id: saved.id },
          {
            onSuccess: (invoice) => {
              toast({
                title: `Invoice ${invoice.number} created ✅`,
                description: "The quote is marked accepted.",
              })
              navigate(`/admin/billing/${invoice.id}`)
            },
            onError: (error) =>
              toast({
                variant: "destructive",
                title: "Could not convert",
                description: serverMessage(error, "Please try again."),
              }),
          },
        ),
      () => {},
    )

  const onSend = (to: string) =>
    persist().then(
      (saved) =>
        send.mutate(
          { id: saved.id, body: { to } },
          {
            onSuccess: () => {
              setSendTo(null)
              toast({ title: `Sent to ${to} ✅` })
            },
            onError: (error) =>
              toast({
                variant: "destructive",
                title: "Not sent",
                description: serverMessage(error, "Please try again."),
              }),
          },
        ),
      () => {},
    )

  const whatsappText = doc
    ? `Hello ${form.bill_to_name.split(" ")[0]}, thank you for choosing RynexNative. Here is our ${KIND_LABEL[kind].toLowerCase()} ${doc.number}${
        form.title ? ` for ${form.title}` : ""
      }: ${money(totals.total, form.currency)}. I am sending the PDF here as well.`
    : ""

  const state = doc ? STATE_LABEL[doc.state] : STATE_LABEL.draft
  const busy = save.isPending || convert.isPending || send.isPending
  const editable = !doc || doc.status !== "void"

  return (
    <>
      <Link
        to={`/admin/billing?tab=${kind === "quote" ? "quotes" : "invoices"}`}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Quotes & invoices
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-foreground/55">{KIND_LABEL[kind]}</p>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins flex items-center gap-3 flex-wrap">
            {doc ? doc.number : `New ${KIND_LABEL[kind].toLowerCase()}`}
            {doc && <Pill className={state.className}>{state.label}</Pill>}
          </h1>
          {doc?.source_quote && (
            <p className="text-sm text-foreground/60 mt-1">
              From quote{" "}
              <Link to={`/admin/billing/${doc.source_quote.id}`} className="text-primary font-medium">
                {doc.source_quote.number}
              </Link>
            </p>
          )}
          {doc && doc.invoices.length > 0 && (
            <p className="text-sm text-foreground/60 mt-1">
              Invoice:{" "}
              {doc.invoices.map((inv) => (
                <Link key={inv.id} to={`/admin/billing/${inv.id}`} className="text-primary font-medium mr-2">
                  {inv.number}
                </Link>
              ))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pdfBusy || busy} onClick={() => pdf(false)} className={cn(buttonGhost, "h-11 px-4")}>
            {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            View PDF
          </button>
          <button type="button" disabled={pdfBusy || busy} onClick={() => pdf(true)} className={cn(buttonGhost, "h-11 px-4")}>
            <Download className="h-4 w-4" />
            Download
          </button>
          {doc && editable && (
            <>
              <button type="button" disabled={busy} onClick={() => setSendTo(form.bill_to_email)} className={cn(buttonGhost, "h-11 px-4")}>
                <Mail className="h-4 w-4" />
                Email
              </button>
              {form.bill_to_phone && (
                <a
                  href={`https://wa.me/${whatsappNumber(form.bill_to_phone)}?text=${encodeURIComponent(whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-4 rounded-lg bg-[#25D366] text-white inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-[#1ebe5b]"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </>
          )}
          {doc && kind === "quote" && editable && doc.status !== "declined" && doc.invoices.length === 0 && (
            <button type="button" disabled={busy} onClick={onConvert} className={buttonPrimary}>
              {convert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Convert to invoice
            </button>
          )}
        </div>
      </div>

      <form id="document-form" onSubmit={onSave}>
        <Section title="Bill to">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Client" wide hint="Choosing a client fills in the details below.">
              <select value={form.client} onChange={(e) => chooseClient(e.target.value)} className={inputClass}>
                <option value="">Not linked to a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Name *">
              <input required value={form.bill_to_name} onChange={(e) => set("bill_to_name", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Company / institution">
              <input value={form.bill_to_company} onChange={(e) => set("bill_to_company", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.bill_to_phone} onChange={(e) => set("bill_to_phone", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.bill_to_email} onChange={(e) => set("bill_to_email", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Address" wide>
              <input value={form.bill_to_address} onChange={(e) => set("bill_to_address", e.target.value)} className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Title" wide>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="E.g. Professional Website" className={inputClass} />
            </Field>
            <Field label="Date">
              <input required type="date" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} className={inputClass} />
            </Field>
            {kind === "quote" ? (
              <Field label="Valid until" hint={!form.valid_until && profile ? `Default: ${profile.quote_valid_days} days` : undefined}>
                <input type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} className={inputClass} />
              </Field>
            ) : (
              <Field label="Due date" hint={!form.due_date && profile ? `Default: ${profile.invoice_due_days} days` : undefined}>
                <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className={inputClass} />
              </Field>
            )}
            <Field label="Currency">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value as Form["currency"])} className={inputClass}>
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="VAT">
              <span className="flex items-center gap-3 h-[46px]">
                <Switch checked={form.apply_vat} onCheckedChange={(v) => set("apply_vat", v)} aria-label="Add VAT" />
                {form.apply_vat ? (
                  <span className="flex items-center gap-1 text-sm">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.vat_rate}
                      onChange={(e) => set("vat_rate", e.target.value)}
                      aria-label="VAT rate"
                      className={cn(inputClass, "w-20 px-2 py-1.5")}
                    />
                    %
                  </span>
                ) : (
                  <span className="text-sm text-foreground/60">No VAT</span>
                )}
              </span>
            </Field>
          </div>
        </Section>

        <Section title="Items">
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={index} className="rounded-xl border border-border p-3 sm:p-4 bg-card/40">
                <div className="grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[1fr_90px_160px_auto] gap-2 items-start">
                  <input
                    value={item.description}
                    onChange={(e) => setItem(index, { description: e.target.value })}
                    placeholder="Description, e.g. Company website"
                    aria-label="Description"
                    className={cn(inputClass, "font-medium col-span-2 sm:col-span-1")}
                  />
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => {
                      setItems((list) => (list.length > 1 ? list.filter((_, i) => i !== index) : [emptyItem()]))
                      setDirty(true)
                    }}
                    className="sm:order-last h-[46px] w-10 rounded-lg text-foreground/40 hover:text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => setItem(index, { quantity: e.target.value })}
                    aria-label="Quantity"
                    placeholder="Qty"
                    className={cn(inputClass, "text-right")}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => setItem(index, { unit_price: e.target.value })}
                    aria-label="Unit price"
                    placeholder="Unit price"
                    className={cn(inputClass, "text-right")}
                  />
                </div>
                <textarea
                  rows={2}
                  value={item.details}
                  onChange={(e) => setItem(index, { details: e.target.value })}
                  placeholder="Details shown under the description (optional, one per line)"
                  aria-label="Details"
                  className={cn(inputClass, "mt-2 text-sm resize-y")}
                />
                <p className="text-right text-sm text-foreground/60 mt-1">
                  {money((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), form.currency)}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setItems((list) => [...list, emptyItem()])
              setDirty(true)
            }}
            className={cn(buttonGhost, "mt-3")}
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>

          <dl className="mt-5 ml-auto max-w-xs text-sm space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-foreground/60">Subtotal</dt>
              <dd>{money(totals.subtotal, form.currency)}</dd>
            </div>
            {form.apply_vat && (
              <div className="flex justify-between">
                <dt className="text-foreground/60">VAT ({form.vat_rate}%)</dt>
                <dd>{money(totals.vat, form.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-primary/40 pt-1.5 text-base font-bold">
              <dt>Total</dt>
              <dd data-testid="document-total">{money(totals.total, form.currency)}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Notes & terms">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Notes (shown on the document)">
              <textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={cn(inputClass, "text-sm resize-y")} />
            </Field>
            <Field label="Terms">
              <textarea rows={4} value={form.terms} onChange={(e) => set("terms", e.target.value)} className={cn(inputClass, "text-sm resize-y")} />
            </Field>
          </div>
        </Section>
      </form>

      {/* Outside the document form: forms cannot be nested */}
      {doc && kind === "invoice" && <Payments doc={doc} />}

      <div className="sticky bottom-20 lg:bottom-4 z-20 glass rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex flex-wrap gap-1">
          {doc && kind === "quote" && doc.status !== "accepted" && editable && (
            <>
              {doc.status === "draft" && (
                <button type="button" onClick={() => setStatus("sent", "Marked as sent")} className={buttonGhost}>
                  Mark as sent
                </button>
              )}
              <button type="button" onClick={() => setStatus("declined", "Marked as declined")} className={buttonGhost}>
                <XCircle className="h-4 w-4" />
                Declined
              </button>
            </>
          )}
          {doc && kind === "invoice" && doc.status === "draft" && (
            <button type="button" onClick={() => setStatus("sent", "Marked as sent")} className={buttonGhost}>
              Mark as sent
            </button>
          )}
          {doc && doc.status !== "draft" && doc.status !== "void" && (
            <button type="button" onClick={() => setStatus("void", "Voided")} className={cn(buttonGhost, "text-foreground/60")}>
              <Ban className="h-4 w-4" />
              Void
            </button>
          )}
          {doc && doc.status === "void" && (
            <button type="button" onClick={() => setStatus("draft", "Back to draft")} className={buttonGhost}>
              Restore as draft
            </button>
          )}
          {doc && doc.status === "draft" && (
            <button type="button" onClick={() => setConfirmDelete(true)} className={cn(buttonGhost, "text-red-600")}>
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
          <button type="submit" form="document-form" disabled={busy || !editable} className={buttonPrimary}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>

      <AlertDialog open={sendTo !== null} onOpenChange={(open) => !open && setSendTo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email {doc?.number}</AlertDialogTitle>
            <AlertDialogDescription>The PDF is attached. Replies go to our email address.</AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="email"
            value={sendTo ?? ""}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="client@example.com"
            aria-label="Send to"
            className={inputClass}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!sendTo?.includes("@") || send.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (sendTo) onSend(sendTo.trim())
              }}
            >
              {send.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              It is removed permanently. Documents already sent should be voided instead, so the numbers stay accounted for.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                doc &&
                remove.mutate(doc.id, {
                  onSuccess: () => {
                    toast({ title: "Deleted" })
                    navigate("/admin/billing", { replace: true })
                  },
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
