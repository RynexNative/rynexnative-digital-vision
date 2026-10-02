import { useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, ScanLine, Trash2, Users } from "lucide-react"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { slugify } from "@/features/alerts/types"
import { useDeleteEvent, useEventsAdmin, useSaveEvent, useSetEventPublished, type EventInput } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import type { DashboardEvent } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { DateBadge } from "@/features/events/components"
import { EVENT_MODES, EVENT_TYPES, formatEventDay, formatEventTime, formatPrice, type EventMode, type EventType } from "@/features/events/types"
import { useToast } from "@/hooks/use-toast"
import { ApiError, errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Draft = Omit<EventInput, "starts_at" | "ends_at" | "registration_deadline" | "capacity" | "price"> & {
  id?: string
  starts_at: string
  ends_at: string
  registration_deadline: string
  capacity: string
  price: string
}

/** ISO -> value for <input type="datetime-local"> in the browser's time zone */
function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

const EMPTY: Draft = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  cover_image: "",
  event_type: "training",
  mode: "physical",
  venue: "",
  online_link: "",
  starts_at: "",
  ends_at: "",
  capacity: "",
  price: "0",
  registration_deadline: "",
  registrations_open: true,
  is_published: false,
}

function toDraft(e: DashboardEvent): Draft {
  return {
    ...e,
    starts_at: toLocalInput(e.starts_at),
    ends_at: toLocalInput(e.ends_at),
    registration_deadline: toLocalInput(e.registration_deadline),
    capacity: e.capacity === null ? "" : String(e.capacity),
    price: String(e.price),
  }
}

function EventEditor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { toast } = useToast()
  const save = useSaveEvent()
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const needsVenue = draft.mode !== "online"
  const needsLink = draft.mode !== "physical"

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: EventInput = {
      slug: draft.slug || slugify(draft.title),
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      description: draft.description,
      cover_image: draft.cover_image,
      event_type: draft.event_type,
      mode: draft.mode,
      venue: needsVenue ? draft.venue.trim() : "",
      online_link: needsLink ? draft.online_link.trim() : "",
      starts_at: fromLocalInput(draft.starts_at) as string,
      ends_at: fromLocalInput(draft.ends_at),
      registration_deadline: fromLocalInput(draft.registration_deadline),
      capacity: draft.capacity ? Number(draft.capacity) : null,
      price: Number(draft.price || 0),
      registrations_open: draft.registrations_open,
      is_published: draft.is_published,
    }
    save.mutate(
      { id: draft.id, data },
      {
        onSuccess: () => {
          toast({ title: draft.is_published ? "Tukio limechapishwa ✅" : "Rasimu imehifadhiwa" })
          onDone()
        },
        onError: (error) =>
          toast({ variant: "destructive", title: "Imeshindikana kuhifadhi", description: validationMessage(error) ?? errorMessage(error, "Jaribu tena.") }),
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <ImageField value={draft.cover_image} onChange={(url) => set("cover_image", url)} label="Picha / bango la tukio" />
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Jina la tukio *</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={draft.title}
          onChange={(e) => {
            set("title", e.target.value)
            if (!slugTouched) set("slug", slugify(e.target.value))
          }}
          className={inputClass}
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Aina</span>
          <select value={draft.event_type} onChange={(e) => set("event_type", e.target.value as EventType)} className={inputClass}>
            {(Object.keys(EVENT_TYPES) as EventType[]).map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPES[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Litafanyika wapi</span>
          <select value={draft.mode} onChange={(e) => set("mode", e.target.value as EventMode)} className={inputClass}>
            {(Object.keys(EVENT_MODES) as EventMode[]).map((m) => (
              <option key={m} value={m}>
                {EVENT_MODES[m]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {needsVenue && (
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Mahali *</span>
          <input required maxLength={200} value={draft.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Mf. Mwatano Center, Dodoma" className={inputClass} />
        </label>
      )}
      {needsLink && (
        <label className="block">
          <span className="block text-sm font-medium mb-1">Link ya Zoom / Google Meet</span>
          <span className="block text-xs text-foreground/50 mb-1.5">Inaonekana kwa waliothibitishwa tu, kwenye tiketi yao</span>
          <input type="url" value={draft.online_link} onChange={(e) => set("online_link", e.target.value)} placeholder="https://..." className={inputClass} />
        </label>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Linaanza *</span>
          <input required type="datetime-local" value={draft.starts_at} onChange={(e) => set("starts_at", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Linaisha</span>
          <input type="datetime-local" min={draft.starts_at} value={draft.ends_at} onChange={(e) => set("ends_at", e.target.value)} className={inputClass} />
        </label>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Bei (TZS)</span>
          <input type="number" min={0} step={500} value={draft.price} onChange={(e) => set("price", e.target.value)} className={inputClass} />
          <span className="block text-xs text-foreground/50 mt-1">0 = bure</span>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Nafasi</span>
          <input type="number" min={1} value={draft.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Bila kikomo" className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Mwisho wa usajili</span>
          <input type="datetime-local" max={draft.starts_at} value={draft.registration_deadline} onChange={(e) => set("registration_deadline", e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Muhtasari *</span>
        <textarea required minLength={10} maxLength={400} rows={2} value={draft.summary} onChange={(e) => set("summary", e.target.value)} className={cn(inputClass, "resize-y")} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">Maelezo kamili</span>
        <span className="block text-xs text-foreground/50 mb-1.5">Utajifunza nini, nani anafaa kuhudhuria, ratiba... · "## " kichwa · "- " orodha</span>
        <textarea rows={10} value={draft.description} onChange={(e) => set("description", e.target.value)} className={cn(inputClass, "resize-y text-sm leading-relaxed")} />
      </label>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 py-3 cursor-pointer">
        <span>
          <span className="block text-sm font-medium">Usajili uko wazi</span>
          <span className="block text-xs text-foreground/50">Zima kufunga usajili bila kuficha tukio</span>
        </span>
        <Switch checked={draft.registrations_open} onCheckedChange={(v) => set("registrations_open", v)} />
      </label>
      <details className="rounded-xl border border-foreground/10 px-4 py-3">
        <summary className="text-sm font-medium cursor-pointer">Mipangilio ya link</summary>
        <label className="block mt-3">
          <span className="block text-xs text-foreground/60 mb-1.5">rynexnative.com/#/matukio/</span>
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", slugify(e.target.value))
            }}
            className={cn(inputClass, "font-mono text-sm")}
          />
        </label>
      </details>
      <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-foreground/10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={draft.is_published} onCheckedChange={(v) => set("is_published", v)} />
          <span className="text-sm font-medium">{draft.is_published ? "Chapisha (linaonekana kwa wote)" : "Rasimu (halionekani)"}</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className="h-11 px-4 rounded-xl glass font-medium">
            Ghairi
          </button>
          <button type="submit" disabled={save.isPending} className={buttonPrimary}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {draft.is_published ? "Chapisha" : "Hifadhi rasimu"}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function EventsAdminPage() {
  const { toast } = useToast()
  const { data: events = [], isLoading, isError, refetch } = useEventsAdmin()
  const setPublished = useSetEventPublished()
  const remove = useDeleteEvent()
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming")
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<DashboardEvent | null>(null)

  const now = Date.now()
  const isPast = (e: DashboardEvent) => new Date(e.ends_at ?? e.starts_at).getTime() < now
  const upcoming = events.filter((e) => !isPast(e)).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const past = events.filter(isPast)
  const visible = filter === "upcoming" ? upcoming : filter === "past" ? past : events

  return (
    <>
      <PageHeader
        title="Matukio"
        subtitle="Mafunzo, warsha na webinars. Simamia usajili na malipo."
        action={
          <div className="flex gap-2">
            <Link to="/admin/scan" className={cn(buttonGhost, "h-11 px-4")}>
              <ScanLine className="h-4 w-4" />
              Scan tiketi
            </Link>
            <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Tukio jipya
            </button>
          </div>
        }
      />
      <div className="mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "upcoming", label: `Yajayo (${upcoming.length})` },
            { id: "past", label: `Yaliyopita (${past.length})` },
            { id: "all", label: "Yote" },
          ]}
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "upcoming" ? "Hakuna tukio lijalo" : "Hakuna matukio hapa"}
          action={
            filter === "upcoming" && (
              <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
                <Plus className="h-4 w-4" />
                Panga tukio
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((event) => {
            const total = event.counts.confirmed + event.counts.awaiting_payment + event.counts.to_verify
            return (
              <li key={event.id} className="glass rounded-2xl p-4 md:p-5">
                <div className="flex gap-4">
                  <DateBadge iso={event.starts_at} className="flex-shrink-0 bg-card" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {event.is_published ? (
                        <Pill className="bg-primary/15 text-primary border-primary/30">Hewani</Pill>
                      ) : (
                        <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Rasimu</Pill>
                      )}
                      {!event.registrations_open && <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Usajili umefungwa</Pill>}
                      <span className="text-xs text-foreground/50">
                        {EVENT_TYPES[event.event_type]} · {formatPrice(event.price)}
                      </span>
                    </div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs text-foreground/60 mt-0.5 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatEventDay(event.starts_at)} · {formatEventTime(event.starts_at, event.ends_at)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/admin/matukio/${event.id}`}
                  className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-card/50 p-3 hover:bg-card/80 transition-colors"
                >
                  {[
                    ["Waliojisajili", `${total}${event.capacity ? ` / ${event.capacity}` : ""}`, ""],
                    ["Wamethibitishwa", event.counts.confirmed, "text-emerald-500"],
                    ["Malipo ya kukagua", event.counts.to_verify, event.counts.to_verify ? "text-accent" : ""],
                    ["Wameingia", event.counts.checked_in, ""],
                  ].map(([label, value, color]) => (
                    <div key={label as string}>
                      <p className="text-[11px] text-foreground/50">{label}</p>
                      <p className={cn("text-lg font-bold", color as string)}>{value}</p>
                    </div>
                  ))}
                </Link>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/admin/matukio/${event.id}`} className={cn(buttonGhost, "text-primary")}>
                    <Users className="h-4 w-4" />
                    Usajili
                    {event.counts.to_verify > 0 && (
                      <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                        {event.counts.to_verify}
                      </span>
                    )}
                  </Link>
                  <button type="button" onClick={() => setEditing(toDraft(event))} className={buttonGhost}>
                    <Pencil className="h-4 w-4" />
                    Hariri
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPublished.mutate(
                        { id: event.id, published: !event.is_published },
                        { onSuccess: () => toast({ title: event.is_published ? "Limeondolewa hewani" : "Limechapishwa ✅" }) },
                      )
                    }
                    className={buttonGhost}
                  >
                    {event.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {event.is_published ? "Ondoa" : "Chapisha"}
                  </button>
                  {event.is_published && (
                    <Link to={`/matukio/${event.slug}`} target="_blank" className={buttonGhost} aria-label="Ona kwenye website">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button type="button" onClick={() => setDeleting(event)} className={cn(buttonGhost, "hover:text-red-500")} aria-label="Futa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? "Hariri tukio" : "Tukio jipya"}</SheetTitle>
            <SheetDescription>Tarehe na saa ziko kwenye saa za Tanzania (EAT) kama ilivyo kwenye kifaa chako.</SheetDescription>
          </SheetHeader>
          {editing && <EventEditor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Futa tukio hili?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" litafutwa kabisa. Tukio lenye watu waliojisajili haliwezi kufutwa; lifiche au funga usajili badala yake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ghairi</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Tukio limefutwa" }),
                  onError: (error) =>
                    toast({
                      variant: "destructive",
                      title: "Halikufutwa",
                      description:
                        (error instanceof ApiError ? (error.data as { detail?: string } | null)?.detail : undefined) ?? errorMessage(error, "Jaribu tena."),
                    }),
                })
              }
            >
              Futa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
