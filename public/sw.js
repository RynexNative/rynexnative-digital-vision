/*
 * RynexNative dashboard notifications (Web Push).
 * Only shows pop-ups and opens the dashboard when one is clicked; it does not
 * cache or intercept any page, so the public website behaves exactly as before.
 */

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

const isDashboard = (url) => new URL(url).pathname.startsWith("/admin")

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "RynexNative", body: event.data ? event.data.text() : "" }
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      // Tell open dashboards at once, so the bell updates without waiting for the next check
      windows.filter((w) => isDashboard(w.url)).forEach((w) => w.postMessage({ type: "rn-notification", data }))
      // The person is looking at the dashboard: it shows the message itself (toast and sound)
      if (windows.some((w) => w.focused && w.visibilityState === "visible" && isDashboard(w.url))) return

      await self.registration.showNotification(data.title || "RynexNative", {
        body: data.body || "",
        icon: "/notification-icon.png",
        badge: "/notification-badge.png",
        data: { url: data.url || "/admin" },
        tag: `${data.tag || "rn"}-${Date.now()}`,
        timestamp: Date.now(),
      })
    })(),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || "/admin", self.location.origin)
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      const open = windows.find((w) => isDashboard(w.url))
      if (open) {
        await open.focus()
        if (target.origin === self.location.origin) open.postMessage({ type: "rn-open", path: target.pathname + target.search })
        return
      }
      await self.clients.openWindow(target.href)
    })(),
  )
})
