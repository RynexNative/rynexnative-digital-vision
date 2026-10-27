import { useEffect, useState, type ReactNode } from "react"
import { AlertTriangle, BellRing, Building, CalendarClock, CheckCircle2, Eye, Loader2, Mail, MessageCircle, Save, Send, XCircle } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { Switch } from "@/components/ui/switch"
import { useBusinessProfile, useSaveProfile } from "@/features/billing/api"
import type { BusinessProfile } from "@/features/billing/types"
import { useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { formatWhen } from "@/features/dashboard/types"
import { ErrorState, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { dashboardFile, dashboardRequest, serverMessage } from "@/lib/api"
import { usePushSwitch } from "@/features/notifications/NotificationBell"
import { disablePush } from "@/features/notifications/push"
import { cn } from "@/lib/utils"

type ChannelStatus = { configured: boolean; recipients: string[]; issues: string[]; server?: string; sender?: string; template?: string }
type LogEntry = { id: number; created_at: string; event: string; channel: string; recipient: string; subject: string; ok: boolean; error: string }
type PushStatus = { configured: boolean; devices: number; this_user_devices: number; issues: string[] }
type NotificationsStatus = { email: ChannelStatus; whatsapp: ChannelStatus; push: PushStatus; log: LogEntry[] }

/** Browser pop-ups: server set-up, and a switch for this very browser. */
function PopupsCard({ status }: { status: PushStatus }) {
  const { state, busy, turnOn, refresh } = usePushSwitch()
  const { toast } = useToast()
  const invalidate = useInvalidate()
  const [turningOff, setTurningOff] = useState(false)
  const here =
    state === "on" ? "On for this browser" : state === "blocked" ? "Blocked in this browser's settings" : state === "unsupported" ? "Not supported by this browser" : "Off for this browser"
  return (
    <div className={cn("glass rounded-2xl p-5 md:col-span-2", status.configured ? "border-emerald-500/30" : "border-amber-500/40")}>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <BellRing className="h-4 w-4" />
        </span>
        <h3 className="font-semibold flex-1">Browser pop-ups</h3>
        {status.configured ? (
          <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Ready
          </span>
        ) : (
          <span className="text-sm text-amber-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Not set up
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/70">
        A pop-up with a sound on every device where someone switched them on, even with the dashboard closed. {status.devices} device(s) in total,{" "}
        {status.this_user_devices} of them yours.
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <span className={cn("text-sm font-medium", state === "on" ? "text-emerald-700" : "text-foreground/60")}>{here}</span>
        {status.configured && state === "off" && (
          <button
            type="button"
            onClick={async () => {
              await turnOn()
              invalidate("notifications")
            }}
            disabled={busy}
            className={buttonGhost}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
            Turn on for this browser
          </button>
        )}
        {state === "on" && (
          <button
            type="button"
            disabled={turningOff}
            onClick={async () => {
              setTurningOff(true)
              await disablePush()
              setTurningOff(false)
              invalidate("notifications")
              await refresh()
              toast({ title: "Pop-ups switched off for this browser" })
            }}
            className={cn(buttonGhost, "text-foreground/60")}
          >
            Turn off
          </button>
        )}
      </div>
      {status.issues.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-800 bg-amber-500/10 rounded-xl p-3">
          {status.issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

type DigestStatus = {
  recipients: string[]
  scheduled: boolean
  when_clear: boolean
  today: { subject: string; counts: { overdue: number; week: number; later: number; check: number } }
  runs: { date: string; status: string; items: number; detail: string; at: string }[]
}

const RUN_STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: "Sent", className: "text-emerald-700" },
  skipped: { label: "Nothing to report", className: "text-foreground/55" },
  failed: { label: "Failed", className: "text-red-700" },
  sending: { label: "Sending", className: "text-foreground/55" },
}

function DailyDigest() {
  const { toast } = useToast()
  const invalidate = useInvalidate()
  const { data, isLoading, isError, refetch } = useDashboardQuery<DigestStatus>(["dashboard", "ops", "digest"], "/ops/digest/")
  const [previewing, setPreviewing] = useState(false)
  const sendNow = useMutation({
    mutationFn: () => dashboardRequest<{ status: string; subject?: string }>("/ops/digest/", { method: "POST" }),
    onSuccess: (result) => {
      toast({ title: result.status === "sent" ? "Sent ✅" : "Not sent", description: result.subject })
      invalidate("ops", "notifications")
    },
    onError: (error) => toast({ variant: "destructive", title: "Not sent", description: serverMessage(error, "Please try again.") }),
  })

  const preview = async () => {
    // Open the tab first: browsers block pop-ups opened after an await
    const tab = window.open("", "_blank")
    setPreviewing(true)
    try {
      const url = URL.createObjectURL(await dashboardFile("/ops/digest/preview/"))
      if (tab) tab.location.href = url
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      tab?.close()
      toast({ variant: "destructive", title: "Could not open the preview", description: serverMessage(error, "Please try again.") })
    } finally {
      setPreviewing(false)
    }
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (isLoading || !data) return <ListSkeleton rows={1} />

  const { counts } = data.today
  return (
    <div className={cn("glass rounded-2xl p-5", data.scheduled ? "border-emerald-500/30" : "border-amber-500/40")}>
      <p className="text-sm text-foreground/70">
        Every morning (around 07:30), the team gets one email with what is overdue, due this week and coming up: domains, server and
        subscription payments, support periods, unpaid invoices and quotes about to expire.
        {!data.when_clear && " On days with nothing to report, no email is sent."}
      </p>
      <p className="text-sm mt-2">
        Goes to: {data.recipients.length ? data.recipients.join(", ") : <span className="text-amber-700">nobody yet (set NOTIFY_EMAILS)</span>}
      </p>
      {!data.scheduled && (
        <p className="mt-3 text-sm text-amber-800 bg-amber-500/10 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          The daily schedule is not connected yet: set OPS_DIGEST_TOKEN on Render and the same value as the GitHub secret OPS_DIGEST_TOKEN in the
          backend repository. “Send now” works already.
        </p>
      )}
      <div className="mt-4 rounded-xl bg-card/60 border border-border p-3 text-sm">
        <span className="text-foreground/55">Today: </span>
        <b>{counts.overdue}</b> overdue · <b>{counts.week}</b> due this week · <b>{counts.later}</b> coming up
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={preview} disabled={previewing} className={cn(buttonGhost, "h-11 px-4")}>
          {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Preview today’s email
        </button>
        <button type="button" onClick={() => sendNow.mutate()} disabled={sendNow.isPending} className={cn(buttonGhost, "h-11 px-4")}>
          {sendNow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send now
        </button>
      </div>
      {data.runs.length > 0 && (
        <ul className="mt-4 divide-y divide-border text-sm">
          {data.runs.map((run) => {
            const status = RUN_STATUS[run.status] ?? { label: run.status, className: "" }
            return (
              <li key={run.date} className="py-2 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="w-24 text-foreground/60">{run.date}</span>
                <span className={cn("font-semibold", status.className)}>{status.label}</span>
                <span className="text-foreground/55 min-w-0 break-words">{run.detail}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={cn("block", wide && "sm:col-span-2")}>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-foreground/50 mt-1">{hint}</span>}
    </label>
  )
}

function ProfileForm({ profile }: { profile: BusinessProfile }) {
  const { toast } = useToast()
  const save = useSaveProfile()
  const [values, setValues] = useState(profile)
  useEffect(() => setValues(profile), [profile])
  const set = <K extends keyof BusinessProfile>(name: K, value: BusinessProfile[K]) => setValues((v) => ({ ...v, [name]: value }))
  const text = (name: keyof BusinessProfile, label: string, hint?: string, wide?: boolean) => (
    <Field label={label} hint={hint} wide={wide}>
      <input value={String(values[name] ?? "")} onChange={(e) => set(name, e.target.value as never)} className={inputClass} />
    </Field>
  )
  const area = (name: keyof BusinessProfile, label: string, hint?: string) => (
    <Field label={label} hint={hint} wide>
      <textarea rows={3} value={String(values[name] ?? "")} onChange={(e) => set(name, e.target.value as never)} className={cn(inputClass, "text-sm resize-y")} />
    </Field>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(values, {
          onSuccess: () => toast({ title: "Saved ✅", description: "New quotes and invoices use these details." }),
          onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
        })
      }}
      className="glass rounded-2xl p-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {text("name", "Business name")}
        {text("tagline", "Tagline")}
        {area("address", "Address")}
        {text("phone", "Phone")}
        {text("email", "Email", "Shown on documents; client replies go here")}
        {text("website", "Website")}
        {text("tin", "TIN")}
        {text("vrn", "VRN", "VAT registration number, if registered")}
        <Field label="VAT">
          <span className="flex items-center gap-3 h-[46px]">
            <Switch checked={values.vat_by_default} onCheckedChange={(v) => set("vat_by_default", v)} aria-label="Add VAT by default" />
            <span className="text-sm text-foreground/70">Add VAT to new documents at</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={values.vat_rate}
              onChange={(e) => set("vat_rate", e.target.value)}
              aria-label="VAT rate"
              className={cn(inputClass, "w-20 px-2 py-1.5")}
            />
            %
          </span>
        </Field>
        {area("payment_details", "How clients pay", "One line each, e.g. “M-Pesa Lipa Namba: 123456 (RynexNative)” or bank name and account number")}
        <Field label="Quotes are valid for (days)">
          <input type="number" min="1" value={values.quote_valid_days} onChange={(e) => set("quote_valid_days", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Invoices are due after (days)">
          <input type="number" min="0" value={values.invoice_due_days} onChange={(e) => set("invoice_due_days", Number(e.target.value))} className={inputClass} />
        </Field>
        {area("quote_terms", "Quote terms")}
        {area("invoice_terms", "Invoice terms")}
      </div>
      <div className="flex justify-end mt-5">
        <button type="submit" disabled={save.isPending} className={buttonPrimary}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </form>
  )
}

function Channel({ icon, title, status, extra }: { icon: ReactNode; title: string; status: ChannelStatus; extra: ReactNode }) {
  return (
    <div className={cn("glass rounded-2xl p-5", status.configured ? "border-emerald-500/30" : "border-amber-500/40")}>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
        <h3 className="font-semibold flex-1">{title}</h3>
        {status.configured ? (
          <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Ready
          </span>
        ) : (
          <span className="text-sm text-amber-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Not set up
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/70">
        Goes to: {status.recipients.length ? status.recipients.join(", ") : <span className="text-foreground/50">nobody yet</span>}
      </p>
      <div className="text-sm text-foreground/60">{extra}</div>
      {status.issues.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-800 bg-amber-500/10 rounded-xl p-3">
          {status.issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Notifications() {
  const { toast } = useToast()
  const invalidate = useInvalidate()
  const { data, isLoading, isError, refetch } = useDashboardQuery<NotificationsStatus>(["dashboard", "notifications"], "/notifications/")
  const test = useMutation({
    mutationFn: () => dashboardRequest<{ results: { channel: string; ok: boolean }[] }>("/notifications/test/", { method: "POST" }),
    onSuccess: ({ results }) => {
      const ok = results.filter((r) => r.ok).length
      toast({
        variant: ok === results.length ? "default" : "destructive",
        title: ok === results.length ? "Test sent ✅" : `${results.length - ok} of ${results.length} failed`,
        description: ok === results.length ? "Check your email and WhatsApp." : "See the log below for the reason.",
      })
      invalidate("notifications")
    },
    onError: (error) => toast({ variant: "destructive", title: "Not sent", description: serverMessage(error, "Please try again.") }),
  })

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (isLoading || !data) return <ListSkeleton rows={2} />

  return (
    <>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <Channel
          icon={<Mail className="h-4 w-4" />}
          title="Email"
          status={data.email}
          extra={data.email.server ? <>Server {data.email.server} · from {data.email.sender}</> : null}
        />
        <Channel
          icon={<MessageCircle className="h-4 w-4" />}
          title="WhatsApp"
          status={data.whatsapp}
          extra={<>WhatsApp Cloud API · template “{data.whatsapp.template}”</>}
        />
        <PopupsCard status={data.push} />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button type="button" onClick={() => test.mutate()} disabled={test.isPending} className={cn(buttonGhost, "h-11 px-4")}>
          {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send a test
        </button>
        <p className="text-sm text-foreground/55">
          The team is told at once about package requests, estimates, messages, event registrations and ticket payments.
        </p>
      </div>

      <h3 className="font-semibold mb-2">Recent deliveries</h3>
      {data.log.length === 0 ? (
        <p className="glass rounded-2xl p-5 text-sm text-foreground/55">Nothing sent yet.</p>
      ) : (
        <ul className="glass rounded-2xl divide-y divide-border">
          {data.log.map((entry) => (
            <li key={entry.id} className="px-4 py-3 flex items-start gap-3 text-sm">
              {entry.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{entry.subject}</span>
                <span className="block text-xs text-foreground/55">
                  {entry.channel === "whatsapp" ? "WhatsApp" : entry.channel === "push" ? "Pop-up" : "Email"} · {entry.recipient} · {formatWhen(entry.created_at)}
                </span>
                {entry.error && <span className="block text-xs text-red-700 mt-0.5 break-words">{entry.error}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function SettingsPage() {
  const { data: profile, isLoading, isError, refetch } = useBusinessProfile()
  return (
    <>
      <PageHeader title="Settings" subtitle="Our details on quotes and invoices, and how the team is notified." />

      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" /> Team notifications
        </h2>
        <Notifications />
      </section>

      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" /> Daily operations email
        </h2>
        <DailyDigest />
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" /> Business details on documents
        </h2>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !profile ? <ListSkeleton rows={2} /> : <ProfileForm profile={profile} />}
      </section>
    </>
  )
}
