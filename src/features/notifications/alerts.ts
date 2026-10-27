import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { INBOX_KEY, useInbox } from "./api"
import { pushState, resyncPush } from "./push"
import { playChime, unlockSound } from "./sound"

/**
 * Makes new notifications impossible to miss while the dashboard is open:
 * a toast and a chime when looking at it, a pop-up when the tab is in the background
 * (if this browser has no Web Push), and the unread count in the tab title.
 */
export function useNotificationAlerts() {
  const { data } = useInbox()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const seen = useRef<Set<number> | null>(null)
  const hasPush = useRef(false)

  // Sound may only play after the person has clicked or typed once
  useEffect(() => {
    const unlock = () => unlockSound()
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    void pushState().then((state) => {
      hasPush.current = state === "on"
    })
    void resyncPush()
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  // Messages from the service worker: a push arrived, or a pop-up was clicked
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "rn-notification") queryClient.invalidateQueries({ queryKey: INBOX_KEY })
      if (event.data?.type === "rn-open" && typeof event.data.path === "string") navigate(event.data.path)
    }
    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [navigate, queryClient])

  // New items since the last check
  useEffect(() => {
    if (!data) return
    if (seen.current === null) {
      // First load: what is already there is not "new"
      seen.current = new Set(data.items.map((i) => i.id))
      return
    }
    const fresh = data.items.filter((i) => !i.read && !seen.current!.has(i.id))
    data.items.forEach((i) => seen.current!.add(i.id))
    if (fresh.length === 0) return

    // Counts, badges and lists on screen catch up with what just arrived
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "dashboard" && q.queryKey[1] !== "inbox" && q.queryKey[1] !== "me" })
    playChime()
    const [latest] = fresh
    if (document.visibilityState === "visible") {
      toast({
        title: fresh.length > 1 ? `${fresh.length} new notifications` : latest.title,
        description: fresh.length > 1 ? latest.title : latest.body,
      })
    } else if (!hasPush.current && "Notification" in window && Notification.permission === "granted") {
      // No Web Push on this browser: show the pop-up from the page instead
      const popup = new Notification(latest.title, { body: latest.body, icon: "/notification-icon.png", tag: `rn-${latest.id}` })
      popup.onclick = () => {
        window.focus()
        if (latest.link) navigate(latest.link)
        popup.close()
      }
    }
  }, [data, navigate, queryClient, toast])

  // "(3) Requests | RynexNative" in the tab, so unread items show even from another tab
  const unread = data?.unread ?? 0
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\+?\)\s*/, "")
      document.title = unread ? `(${unread > 99 ? "99+" : unread}) ${base}` : base
    }
    apply()
    // Pages set their own title when they open; put the count back afterwards
    const observer = new MutationObserver(() => {
      if (unread && !/^\(\d+\+?\)/.test(document.title)) apply()
    })
    const titleElement = document.querySelector("title")
    if (titleElement) observer.observe(titleElement, { childList: true })
    return () => observer.disconnect()
  }, [unread])
}
