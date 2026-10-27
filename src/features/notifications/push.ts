import { dashboardRequest } from "@/lib/api"

/** Browser pop-ups through Web Push: the service worker in /sw.js shows them, even with the dashboard closed. */

export type PushState = "unsupported" | "blocked" | "off" | "on"

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

function keyBytes(base64url: string) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" })
}

async function subscription() {
  const reg = await navigator.serviceWorker.getRegistration("/")
  return reg ? reg.pushManager.getSubscription() : null
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported"
  if (Notification.permission === "denied") return "blocked"
  return Notification.permission === "granted" && (await subscription()) ? "on" : "off"
}

/** Asks for permission, subscribes this browser and tells the server. Throws with a readable message. */
export async function enablePush(): Promise<void> {
  if (!pushSupported()) throw new Error("This browser cannot show pop-up notifications.")
  const { public_key, configured } = await dashboardRequest<{ public_key: string; configured: boolean }>("/notifications/push/")
  if (!configured || !public_key) throw new Error("Pop-ups are not set up on the server yet (VAPID keys).")
  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Notifications were not allowed. Allow them in the browser's site settings.")
  const reg = await registration()
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(public_key) })
    } catch {
      throw new Error("This browser could not register for pop-ups. Use Chrome, Edge, Firefox or Safari, and check that notifications are allowed.")
    }
  }
  await dashboardRequest("/notifications/push/", { method: "POST", body: sub.toJSON() })
}

export async function disablePush(): Promise<void> {
  const sub = await subscription()
  if (!sub) return
  await dashboardRequest("/notifications/push/", { method: "DELETE", body: { endpoint: sub.endpoint } }).catch(() => {})
  await sub.unsubscribe()
}

/** If this browser is already subscribed, make sure the server still knows it (e.g. after a server move). */
export async function resyncPush(): Promise<void> {
  if ((await pushState()) !== "on") return
  const sub = await subscription()
  if (sub) await dashboardRequest("/notifications/push/", { method: "POST", body: sub.toJSON() }).catch(() => {})
}
