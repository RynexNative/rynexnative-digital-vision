import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, Bell, BellRing, Calculator, CalendarDays, CheckCheck, CreditCard, Inbox as InboxIcon, Loader2, Mail } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatWhen } from "@/features/dashboard/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useInbox, useMarkRead, type InboxItem } from "./api"
import { enablePush, pushState, type PushState } from "./push"

const EVENT_ICONS: Record<string, React.ReactNode> = {
  package_request: <InboxIcon className="h-4 w-4" />,
  estimate: <Calculator className="h-4 w-4" />,
  contact: <Mail className="h-4 w-4" />,
  registration: <CalendarDays className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  ops_digest: <Activity className="h-4 w-4" />,
}

/** Offer to switch on browser pop-ups for this browser. Shared by the bell and the banner. */
export function usePushSwitch() {
  const { toast } = useToast()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void pushState().then(setState)
  }, [])
  const turnOn = async () => {
    setBusy(true)
    try {
      await enablePush()
      setState("on")
      toast({ title: "Pop-ups are on ✅", description: "New requests and payments now pop up on this device, even with the dashboard closed." })
    } catch (error) {
      setState(await pushState())
      toast({ variant: "destructive", title: "Pop-ups not switched on", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setBusy(false)
    }
  }
  const refresh = () => pushState().then(setState)
  return { state, busy, turnOn, refresh }
}

function Item({ item, onOpen }: { item: InboxItem; onOpen: (item: InboxItem) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn("w-full text-left flex gap-3 px-4 py-3 hover:bg-muted/60 transition-colors", !item.read && "bg-primary/5")}
      >
        <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", item.read ? "bg-muted text-foreground/50" : "bg-primary/15 text-primary")}>
          {EVENT_ICONS[item.event] ?? <BellRing className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm leading-snug", item.read ? "text-foreground/70" : "font-semibold")}>{item.title}</span>
          {item.body && <span className="block text-xs text-foreground/55 mt-0.5 line-clamp-2">{item.body}</span>}
          <span className="block text-[11px] text-foreground/45 mt-1">{formatWhen(item.created_at)}</span>
        </span>
        {!item.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />}
      </button>
    </li>
  )
}

export function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { data } = useInbox()
  const markRead = useMarkRead()
  const { state, busy, turnOn } = usePushSwitch()
  const [open, setOpen] = useState(false)
  const unread = data?.unread ?? 0

  const openItem = (item: InboxItem) => {
    if (!item.read) markRead.mutate({ ids: [item.id] })
    setOpen(false)
    if (item.link) navigate(item.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className={cn("relative h-9 w-9 rounded-xl inline-flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-foreground/5", className)}
        >
          {unread ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-24px))] p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <p className="font-semibold">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={() => markRead.mutate({ all: true })} className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        {!data ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : data.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-foreground/55">Nothing yet. New requests, estimates, messages and payments appear here.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {data.items.map((item) => (
              <Item key={item.id} item={item} onOpen={openItem} />
            ))}
          </ul>
        )}
        {state === "off" && (
          <div className="border-t border-border px-4 py-3 bg-primary/5 flex items-center justify-between gap-3">
            <p className="text-xs text-foreground/70">Get a pop-up on this device when something new arrives.</p>
            <button type="button" onClick={turnOn} disabled={busy} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 flex-shrink-0">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Turn on pop-ups
            </button>
          </div>
        )}
        {state === "blocked" && (
          <p className="border-t border-border px-4 py-3 text-xs text-amber-800 bg-amber-500/10">
            Pop-ups are blocked for this site. Allow notifications in the browser's site settings (the icon left of the address).
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** A one-time invitation at the top of the dashboard until pop-ups are switched on (or dismissed) on this browser. */
export function PushInvite() {
  const { state, busy, turnOn } = usePushSwitch()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("rn:push-invite-dismissed") === "1"
    } catch {
      return false
    }
  })
  if (state !== "off" || dismissed) return null
  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem("rn:push-invite-dismissed", "1")
    } catch {
      // Storage blocked: the invitation simply comes back next time
    }
  }
  return (
    <div className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border-primary/30">
      <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
        <BellRing className="h-5 w-5" />
      </span>
      <p className="flex-1 text-sm">
        <b>Never miss a client.</b> Turn on pop-ups and this device will alert you the moment a request, message or payment arrives, even when the
        dashboard is closed.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={dismiss} className="h-9 px-3 rounded-lg text-sm text-foreground/60 hover:text-foreground">
          Not now
        </button>
        <button type="button" onClick={turnOn} disabled={busy} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Turn on pop-ups
        </button>
      </div>
    </div>
  )
}
