import { useState } from "react"
import { Crown, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { useChangeOwnPassword } from "@/features/accounts/api"
import { usePermissions } from "@/features/dashboard/access"
import { PageHeader } from "@/features/dashboard/ui"
import { buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"

const AREAS: Record<string, string> = {
  requests: "Sales requests",
  billing: "Quotes & invoices",
  operations: "Operations",
  content: "Website content",
  events: "Events",
  insights: "Insights",
  settings: "Settings",
  users: "Users & roles",
  audit: "Activity log",
}
const ACTIONS: Record<string, string> = { view: "see", manage: "change", checkin: "check in tickets" }

export default function AccountPage() {
  const { user } = usePermissions()
  const { toast } = useToast()
  const change = useChangeOwnPassword()
  const [form, setForm] = useState({ current: "", next: "", again: "" })

  // "billing.view", "billing.manage" -> Quotes & invoices: see, change
  const byArea = new Map<string, string[]>()
  for (const code of user?.permissions ?? []) {
    const [area, action] = code.split(".")
    byArea.set(area, [...(byArea.get(area) ?? []), ACTIONS[action] ?? action])
  }

  return (
    <>
      <PageHeader title="My account" subtitle={`Signed in as ${user?.username ?? ""}`} />
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            {user?.is_superuser ? <Crown className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
            {user?.role || "No role yet"}
          </h2>
          {byArea.size === 0 ? (
            <p className="text-sm text-foreground/65">Your account has no permissions yet. Ask an administrator to give you a role.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...byArea.entries()].map(([area, actions]) => (
                <li key={area} className="flex justify-between gap-3">
                  <span>{AREAS[area] ?? area}</span>
                  <span className="text-foreground/60">{actions.join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Change my password
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (form.next !== form.again) {
                toast({ variant: "destructive", title: "The new passwords are not the same" })
                return
              }
              change.mutate(
                { current: form.current, new: form.next },
                {
                  onSuccess: () => {
                    setForm({ current: "", next: "", again: "" })
                    toast({ title: "Password changed ✅" })
                  },
                  onError: (error) => toast({ variant: "destructive", title: "Not changed", description: serverMessage(error, "Please try again.") }),
                },
              )
            }}
            className="space-y-3"
          >
            <input
              required
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              aria-label="Current password"
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              className={inputClass}
            />
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="New password (at least 8 characters)"
              aria-label="New password"
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
              className={inputClass}
            />
            <input
              required
              type="password"
              autoComplete="new-password"
              placeholder="New password again"
              aria-label="New password again"
              value={form.again}
              onChange={(e) => setForm({ ...form, again: e.target.value })}
              className={inputClass}
            />
            <button type="submit" disabled={change.isPending} className={buttonPrimary}>
              {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Change password
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
