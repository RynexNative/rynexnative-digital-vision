import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Session } from "@supabase/supabase-js"
import { ExternalLink, Loader2, LogOut, Mail, Pencil, Phone, Plus, ShieldAlert, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { ALERT_COLUMNS } from "@/features/alerts/api"
import { SeverityBadge } from "@/features/alerts/components"
import { SEVERITY_META, formatAlertDate, slugify, type AlertSeverity, type SecurityAlert } from "@/features/alerts/types"
import { PROJECT_TYPES } from "@/features/estimator/pricing"
import { formatTZS } from "@/features/estimator/calculate"
import type { Database } from "@/integrations/supabase/types"
import { cn } from "@/lib/utils"

type EstimateRow = Database["public"]["Tables"]["project_estimates"]["Row"]

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

function LoginCard() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) toast({ variant: "destructive", title: "Login failed", description: error.message })
  }

  return (
    <form onSubmit={signIn} className="glass rounded-3xl p-8 max-w-sm w-full space-y-4">
      <div className="text-center mb-2">
        <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="" className="w-12 h-12 mx-auto mb-3" />
        <h1 className="text-2xl font-bold font-poppins">Admin</h1>
        <p className="text-sm text-foreground/60">Sign in to manage alerts and estimates</p>
      </div>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Password</span>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </label>
      <button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

type AlertDraft = {
  id?: string
  title: string
  slug: string
  summary: string
  description: string
  category: string
  severity: AlertSeverity
  signs: string
  prevention: string
  if_affected: string
  is_published: boolean
  published_at: string | null
}

const EMPTY_DRAFT: AlertDraft = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  category: "",
  severity: "medium",
  signs: "",
  prevention: "",
  if_affected: "",
  is_published: false,
  published_at: null,
}

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

function toDraft(alert: SecurityAlert): AlertDraft {
  return {
    ...alert,
    signs: alert.signs.join("\n"),
    prevention: alert.prevention.join("\n"),
    if_affected: alert.if_affected.join("\n"),
  }
}

function AlertEditor({
  draft,
  categories,
  onClose,
}: {
  draft: AlertDraft
  categories: string[]
  onClose: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [value, setValue] = useState(draft)
  const [slugTouched, setSlugTouched] = useState(Boolean(draft.id))
  const set = <K extends keyof AlertDraft>(key: K, v: AlertDraft[K]) => setValue((d) => ({ ...d, [key]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: value.title.trim(),
        slug: value.slug || slugify(value.title),
        summary: value.summary.trim(),
        description: value.description.trim(),
        category: value.category.trim(),
        severity: value.severity,
        signs: toLines(value.signs),
        prevention: toLines(value.prevention),
        if_affected: toLines(value.if_affected),
        is_published: value.is_published,
        published_at: value.is_published ? value.published_at ?? new Date().toISOString() : value.published_at,
      }
      const { error } = value.id
        ? await supabase.from("security_alerts").update(payload).eq("id", value.id)
        : await supabase.from("security_alerts").insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
      toast({ title: value.is_published ? "Alert published" : "Draft saved" })
      onClose()
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not save", description: error.message }),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Kichwa (title) *</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={value.title}
          onChange={(e) => {
            set("title", e.target.value)
            if (!slugTouched) set("slug", slugify(e.target.value))
          }}
          className={inputClass}
        />
      </label>
      <div className="grid md:grid-cols-3 gap-4">
        <label className="block md:col-span-1">
          <span className="block text-sm font-medium mb-1.5">Hatari *</span>
          <select value={value.severity} onChange={(e) => set("severity", e.target.value as AlertSeverity)} className={inputClass}>
            {(Object.keys(SEVERITY_META) as AlertSeverity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Aina (category) *</span>
          <input required list="alert-categories" value={value.category} onChange={(e) => set("category", e.target.value)} placeholder="Mobile Money" className={inputClass} />
          <datalist id="alert-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Slug (link)</span>
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={value.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", slugify(e.target.value))
            }}
            className={cn(inputClass, "font-mono text-sm")}
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Muhtasari (summary) * <span className="text-foreground/50 font-normal">— inaonekana kwenye kadi na WhatsApp</span></span>
        <textarea required minLength={10} maxLength={500} rows={2} value={value.summary} onChange={(e) => set("summary", e.target.value)} className={cn(inputClass, "resize-y")} />
        <span className="block text-xs text-foreground/50 mt-1 text-right">{value.summary.length}/500</span>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Jinsi utapeli unavyofanyika <span className="text-foreground/50 font-normal">— acha mstari mtupu kati ya aya</span></span>
        <textarea rows={5} value={value.description} onChange={(e) => set("description", e.target.value)} className={cn(inputClass, "resize-y")} />
      </label>
      <div className="grid md:grid-cols-3 gap-4">
        {(
          [
            ["signs", "Dalili za kutambua"],
            ["prevention", "Jinsi ya kujikinga"],
            ["if_affected", "Kama umeathirika"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="block text-sm font-medium mb-1.5">{label} <span className="text-foreground/50 font-normal">(moja kwa mstari)</span></span>
            <textarea rows={6} value={value[key]} onChange={(e) => set(key, e.target.value)} className={cn(inputClass, "resize-y text-sm")} />
          </label>
        ))}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-foreground/10">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={value.is_published} onCheckedChange={(v) => set("is_published", v)} />
          <span className="text-sm font-medium">{value.is_published ? "Published (inaonekana kwa wote)" : "Draft (haionekani)"}</span>
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-xl glass font-medium">
            Cancel
          </button>
          <button type="submit" disabled={save.isPending} className="h-11 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

function AlertsAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AlertDraft | null>(null)
  const [deleting, setDeleting] = useState<SecurityAlert | null>(null)

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["security-alerts", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_alerts")
        .select(ALERT_COLUMNS)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as SecurityAlert[]
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("security_alerts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
      toast({ title: "Alert deleted" })
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not delete", description: error.message }),
  })

  const categories = Array.from(new Set(alerts.map((a) => a.category))).sort()

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <p className="text-foreground/70 text-sm">{alerts.length} alerts · {alerts.filter((a) => a.is_published).length} published</p>
        <button type="button" onClick={() => setEditing(EMPTY_DRAFT)} className="h-10 px-4 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tahadhari mpya
        </button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />
      ) : error ? (
        <p className="glass rounded-2xl p-6 text-red-400">Could not load alerts: {(error as Error).message}. Has the database migration been run?</p>
      ) : alerts.length === 0 ? (
        <p className="glass rounded-2xl p-10 text-center text-foreground/60">Bado hakuna tahadhari. Bonyeza "Tahadhari mpya".</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <SeverityBadge severity={alert.severity} />
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md",
                      alert.is_published ? "bg-primary/15 text-primary" : "bg-foreground/10 text-foreground/60",
                    )}
                  >
                    {alert.is_published ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-foreground/50">{alert.category}</span>
                </div>
                <p className="font-semibold truncate">{alert.title}</p>
                <p className="text-xs text-foreground/50">{formatAlertDate(alert.published_at) || "Not published yet"}</p>
              </div>
              <div className="flex gap-2">
                {alert.is_published && (
                  <Link to={`/tahadhari/${alert.slug}`} target="_blank" className="h-9 w-9 rounded-lg glass inline-flex items-center justify-center hover:text-primary" aria-label="View">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button type="button" onClick={() => setEditing(toDraft(alert))} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-1.5 text-sm hover:text-primary">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={() => setDeleting(alert)} className="h-9 w-9 rounded-lg glass inline-flex items-center justify-center hover:text-red-500" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit alert" : "New alert"}</DialogTitle>
            <DialogDescription>Andika kwa Kiswahili rahisi. Wasomaji wengi watasoma kwenye simu.</DialogDescription>
          </DialogHeader>
          {editing && <AlertEditor key={editing.id ?? "new"} draft={editing} categories={categories} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.title}" will be removed permanently. Shared links to it will stop working.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Estimate requests                                                   */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { id: "new", label: "New", className: "bg-primary/15 text-primary" },
  { id: "contacted", label: "Contacted", className: "bg-accent/15 text-accent" },
  { id: "won", label: "Won", className: "bg-emerald-500/15 text-emerald-500" },
  { id: "lost", label: "Lost", className: "bg-foreground/10 text-foreground/60" },
]

function EstimatesAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["project-estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_estimates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return data as EstimateRow[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("project_estimates").update({ status }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-estimates"] }),
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not update", description: error.message }),
  })

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />
  if (error) return <p className="glass rounded-2xl p-6 text-red-400">Could not load requests: {(error as Error).message}</p>
  if (rows.length === 0) return <p className="glass rounded-2xl p-10 text-center text-foreground/60">No estimate requests yet.</p>

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const type = PROJECT_TYPES.find((t) => t.id === row.project_type)
        const whatsapp = row.phone.replace(/^0/, "255").replace(/\D/g, "")
        return (
          <li key={row.id} className="glass rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-lg">
                  {row.name}
                  {row.company && <span className="text-foreground/60 font-normal"> · {row.company}</span>}
                </p>
                <p className="text-sm text-foreground/70">
                  {type?.label ?? row.project_type} · {formatTZS(row.estimate_min)} – {formatTZS(row.estimate_max)} · {row.weeks_min}–{row.weeks_max} weeks
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  {new Date(row.created_at).toLocaleString("en-GB")} · #{row.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <select
                value={row.status}
                onChange={(e) => updateStatus.mutate({ id: row.id, status: e.target.value })}
                aria-label="Status"
                className={cn(
                  "h-9 px-3 rounded-lg border-0 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary",
                  STATUS_OPTIONS.find((s) => s.id === row.status)?.className,
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {row.notes && <p className="mt-3 text-sm text-foreground/80 bg-card/50 rounded-xl p-3 whitespace-pre-line">{row.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${row.phone}`} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-1.5 text-sm hover:text-primary">
                <Phone className="h-4 w-4" />
                {row.phone}
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-[#25D366] text-white inline-flex items-center gap-1.5 text-sm font-medium">
                WhatsApp
              </a>
              {row.email && (
                <a href={`mailto:${row.email}`} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-1.5 text-sm hover:text-primary">
                  <Mail className="h-4 w-4" />
                  {row.email}
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  useDocumentTitle("Admin")
  const { session, loading } = useSession()

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", session!.user.id).maybeSingle()
      if (error) throw error
      return Boolean(data)
    },
  })

  // Keep admin pages out of search results
  useEffect(() => {
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex, nofollow"
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  if (loading || (session && checkingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
        <LoginCard />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass rounded-3xl p-8 max-w-lg space-y-4">
          <ShieldAlert className="h-10 w-10 text-amber-500" />
          <h1 className="text-2xl font-bold font-poppins">Not an admin yet</h1>
          <p className="text-foreground/75">
            You are signed in as <strong>{session.user.email}</strong>, but this account has no admin access. Run this in the
            Supabase SQL editor to grant it:
          </p>
          <pre className="bg-card rounded-xl p-4 text-xs overflow-x-auto select-all">
            {`insert into public.admin_users (user_id)\nvalues ('${session.user.id}');`}
          </pre>
          <button type="button" onClick={() => supabase.auth.signOut()} className="h-10 px-4 rounded-xl glass inline-flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-40 glass backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold font-poppins">
            <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="" className="w-7 h-7" />
            <span className="hidden sm:inline">RynexNative</span>
            <span className="text-primary">Admin</span>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden md:inline text-sm text-foreground/60 truncate">{session.user.email}</span>
            <button type="button" onClick={() => supabase.auth.signOut()} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-2 text-sm">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="alerts">
          <TabsList className="mb-6">
            <TabsTrigger value="alerts">Tahadhari</TabsTrigger>
            <TabsTrigger value="estimates">Estimate requests</TabsTrigger>
          </TabsList>
          <TabsContent value="alerts">
            <AlertsAdmin />
          </TabsContent>
          <TabsContent value="estimates">
            <EstimatesAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
