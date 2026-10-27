import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useDashboardQuery } from "@/features/dashboard/api"
import { dashboardRequest } from "@/lib/api"

export type InboxItem = { id: number; event: string; title: string; body: string; link: string; created_at: string; read: boolean }
export type Inbox = { unread: number; items: InboxItem[] }

export const INBOX_KEY = ["dashboard", "inbox"] as const

/** The bell's contents, checked every 20 seconds (also while the tab is in the background). */
export function useInbox() {
  return useDashboardQuery<Inbox>(INBOX_KEY, "/notifications/inbox/", true, 20_000)
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { ids: number[] } | { all: true }) => dashboardRequest<{ unread: number }>("/notifications/inbox/read/", { method: "POST", body }),
    onMutate: (body) => {
      // Update the bell at once
      queryClient.setQueryData<Inbox>(INBOX_KEY, (inbox) => {
        if (!inbox) return inbox
        const ids = "all" in body ? null : new Set(body.ids)
        const items = inbox.items.map((i) => (ids === null || ids.has(i.id) ? { ...i, read: true } : i))
        const newlyRead = inbox.items.filter((i) => !i.read && (ids === null || ids.has(i.id))).length
        return { items, unread: ids === null ? 0 : Math.max(0, inbox.unread - newlyRead) }
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: INBOX_KEY }),
  })
}
