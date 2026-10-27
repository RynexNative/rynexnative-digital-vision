import { useState } from "react"
import { Link } from "react-router-dom"
import { Copy, Crown, History, KeyRound, Loader2, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react"
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
import { useCatalog, useDeleteRole, useRoles, useSaveRole, useSaveUser, useSetPassword, useTeam } from "@/features/accounts/api"
import { generatePassword, type CatalogModule, type Role, type TeamUser } from "@/features/accounts/types"
import { usePermissions } from "@/features/dashboard/access"
import { formatWhen } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-foreground/50 mt-1">{hint}</span>}
    </label>
  )
}

function PasswordInput({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const { toast } = useToast()
  return (
    <div className="flex gap-2">
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={8}
        autoComplete="new-password"
        className={cn(inputClass, "font-mono")}
        placeholder="At least 8 characters"
      />
      <button type="button" title="Generate a strong password" onClick={() => onChange(generatePassword())} className={cn(buttonGhost, "h-[46px] px-3")}>
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Copy"
        disabled={!value}
        onClick={() => navigator.clipboard?.writeText(value).then(() => toast({ title: "Password copied" }))}
        className={cn(buttonGhost, "h-[46px] px-3")}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ---------------- People ---------------- */

type UserDraft = { id?: number; username: string; first_name: string; last_name: string; email: string; role: string; is_owner: boolean; is_active: boolean; password: string }

function UserEditor({ initial, roles, onDone }: { initial: UserDraft; roles: Role[]; onDone: () => void }) {
  const { toast } = useToast()
  const { user: me } = usePermissions()
  const save = useSaveUser()
  const [draft, setDraft] = useState(initial)
  const set = <K extends keyof UserDraft>(key: K, value: UserDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const isNew = !draft.id

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const data: Record<string, unknown> = {
          username: draft.username.trim(),
          first_name: draft.first_name.trim(),
          last_name: draft.last_name.trim(),
          email: draft.email.trim(),
          is_active: draft.is_active,
          ...(me?.is_superuser ? { is_owner: draft.is_owner } : {}),
          ...(draft.is_owner ? {} : { role: draft.role ? Number(draft.role) : null }),
          ...(isNew ? { password: draft.password } : {}),
        }
        save.mutate(
          { id: draft.id, data },
          {
            onSuccess: () => {
              toast({ title: isNew ? "Account created ✅" : "Saved ✅", description: isNew ? "Give them their username and password in person or by phone." : undefined })
              onDone()
            },
            onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
          },
        )
      }}
      className="space-y-4 pb-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name">
          <input value={draft.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input value={draft.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Username *" hint="Used to sign in">
          <input required value={draft.username} onChange={(e) => set("username", e.target.value)} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Email">
          <input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
        </Field>
      </div>

      {me?.is_superuser && (
        <label className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 cursor-pointer">
          <span>
            <span className="font-medium flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-600" /> Owner
            </span>
            <span className="block text-xs text-foreground/60 mt-0.5">Can do everything, including managing other owners. Keep owners to one or two people.</span>
          </span>
          <Switch checked={draft.is_owner} onCheckedChange={(v) => set("is_owner", v)} aria-label="Owner" />
        </label>
      )}

      {!draft.is_owner && (
        <Field label="Role *" hint="Decides exactly what this person can see and do">
          <select required value={draft.role} onChange={(e) => set("role", e.target.value)} className={inputClass}>
            <option value="">Choose a role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.description ? ` · ${r.description}` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      {isNew && (
        <Field label="First password *" hint="They can change it under My account after signing in">
          <PasswordInput required value={draft.password} onChange={(v) => set("password", v)} />
        </Field>
      )}

      {!isNew && (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 h-[46px] cursor-pointer">
          <span className="text-sm font-medium">Account active (can sign in)</span>
          <Switch checked={draft.is_active} onCheckedChange={(v) => set("is_active", v)} />
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className="h-11 px-4 rounded-xl glass font-medium">
          Cancel
        </button>
        <button type="submit" disabled={save.isPending} className={buttonPrimary}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isNew ? "Create account" : "Save"}
        </button>
      </div>
    </form>
  )
}

function ResetPassword({ user, onDone }: { user: TeamUser; onDone: () => void }) {
  const { toast } = useToast()
  const reset = useSetPassword()
  const [password, setPassword] = useState(generatePassword)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        reset.mutate(
          { id: user.id, password },
          {
            onSuccess: () => {
              toast({ title: "Password changed", description: `Give ${user.first_name || user.username} the new password in person or by phone.` })
              onDone()
            },
            onError: (error) => toast({ variant: "destructive", title: "Not changed", description: serverMessage(error, "Please try again.") }),
          },
        )
      }}
      className="space-y-4"
    >
      <PasswordInput required value={password} onChange={setPassword} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="h-11 px-4 rounded-xl glass font-medium">
          Cancel
        </button>
        <button type="submit" disabled={reset.isPending} className={buttonPrimary}>
          {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Set new password
        </button>
      </div>
    </form>
  )
}

function People() {
  const { can, user: me } = usePermissions()
  const { toast } = useToast()
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data: people = [], isLoading, isError, refetch } = useTeam(search)
  const { data: roles = [] } = useRoles()
  const save = useSaveUser()
  const [editing, setEditing] = useState<UserDraft | null>(null)
  const [resetting, setResetting] = useState<TeamUser | null>(null)
  const manage = can("users.manage")
  const canEdit = (u: TeamUser) => manage && (!u.is_owner || me?.is_superuser)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, username, email..." />
        {manage && (
          <button
            type="button"
            onClick={() => setEditing({ username: "", first_name: "", last_name: "", email: "", role: "", is_owner: false, is_active: true, password: generatePassword() })}
            className={cn(buttonPrimary, "sm:ml-auto")}
          >
            <Plus className="h-4 w-4" />
            Add person
          </button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : people.length === 0 ? (
        <EmptyState title="Nobody found" />
      ) : (
        <ul className="space-y-2">
          {people.map((u) => {
            const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username
            return (
              <li key={u.id} className={cn("glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3", !u.is_active && "opacity-60")}>
                <span className="h-11 w-11 rounded-full bg-primary/15 text-primary font-bold font-poppins flex items-center justify-center flex-shrink-0">
                  {name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold flex items-center gap-2 flex-wrap">
                    {name}
                    <span className="text-xs font-normal text-foreground/50">@{u.username}</span>
                    {u.is_owner ? (
                      <Pill className="bg-amber-500/15 text-amber-800 border-amber-500/30">
                        <Crown className="h-3 w-3 mr-1" /> Owner
                      </Pill>
                    ) : (
                      <Pill className="bg-primary/10 text-primary border-primary/25">{u.role_detail?.name ?? "No role"}</Pill>
                    )}
                    {!u.is_active && <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Deactivated</Pill>}
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5">
                    {u.email && `${u.email} · `}
                    Created {formatWhen(u.created_at)}
                    {u.created_by ? ` by ${u.created_by.name}` : ""} · {u.last_login ? `last seen ${formatWhen(u.last_login)}` : "never signed in"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {can("audit.view") && (
                    <Link to={`/admin/activity?actor=${u.id}`} className={buttonGhost}>
                      <History className="h-4 w-4" />
                      Activity
                    </Link>
                  )}
                  {canEdit(u) && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            id: u.id,
                            username: u.username,
                            first_name: u.first_name,
                            last_name: u.last_name,
                            email: u.email,
                            role: u.role_detail?.id ? String(u.role_detail.id) : "",
                            is_owner: u.is_owner,
                            is_active: u.is_active,
                            password: "",
                          })
                        }
                        className={buttonGhost}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button type="button" onClick={() => setResetting(u)} className={buttonGhost}>
                        <KeyRound className="h-4 w-4" />
                        Password
                      </button>
                      {u.username !== me?.username && (
                        <button
                          type="button"
                          onClick={() =>
                            save.mutate(
                              { id: u.id, data: { is_active: !u.is_active } },
                              {
                                onSuccess: () => toast({ title: u.is_active ? `${name} can no longer sign in` : `${name} can sign in again` }),
                                onError: (error) => toast({ variant: "destructive", title: "Not changed", description: serverMessage(error, "Please try again.") }),
                              },
                            )
                          }
                          className={cn(buttonGhost, u.is_active && "hover:text-red-600")}
                        >
                          {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? "Edit account" : "Add a person"}</SheetTitle>
            <SheetDescription>Their role decides what they can see and do. The server checks it on every action.</SheetDescription>
          </SheetHeader>
          {editing && <UserEditor key={editing.id ?? "new"} initial={editing} roles={roles} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <Sheet open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>New password for {resetting?.username}</SheetTitle>
            <SheetDescription>Their current password stops working at once.</SheetDescription>
          </SheetHeader>
          {resetting && <ResetPassword user={resetting} onDone={() => setResetting(null)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ---------------- Roles ---------------- */

function PermissionMatrix({ catalog, value, onChange }: { catalog: CatalogModule[]; value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value)
  const toggle = (code: string, on: boolean) => {
    const next = new Set(set)
    const [module, action] = code.split(".")
    if (on) {
      next.add(code)
      if (action !== "view") next.add(`${module}.view`) // changing something needs seeing it
    } else {
      next.delete(code)
      if (action === "view") Object.keys(catalog.find((m) => m.key === module)?.actions ?? {}).forEach((a) => next.delete(`${module}.${a}`))
    }
    onChange([...next].sort())
  }
  return (
    <ul className="rounded-2xl border border-foreground/10 divide-y divide-foreground/10">
      {catalog.map((m) => (
        <li key={m.key} className="p-4">
          <p className="font-medium">{m.label}</p>
          <p className="text-xs text-foreground/55 mb-2.5">{m.description}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(m.actions).map(([action, label]) => {
              const code = `${m.key}.${action}`
              const on = set.has(code)
              return (
                <button
                  key={code}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(code, !on)}
                  className={cn(
                    "h-9 px-3 rounded-lg border text-sm text-left transition-colors",
                    on ? "bg-primary text-primary-foreground border-primary" : "border-foreground/15 hover:border-primary/40",
                  )}
                  title={code}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
}

type RoleDraft = { id?: number; name: string; description: string; permissions: string[] }

function Roles() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const manage = can("users.manage")
  const { data: roles = [], isLoading, isError, refetch } = useRoles()
  const { data: catalog = [] } = useCatalog()
  const save = useSaveRole()
  const remove = useDeleteRole()
  const [editing, setEditing] = useState<RoleDraft | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const actionLabel = (code: string) => {
    const [module, action] = code.split(".")
    const m = catalog.find((x) => x.key === module)
    return m ? `${m.label}: ${m.actions[action] ?? action}` : code
  }

  return (
    <>
      <div className="flex mb-5">
        <p className="text-sm text-foreground/65 flex-1">A role is a set of permissions. Everyone with the role gets exactly these, checked by the server on every action.</p>
        {manage && (
          <button type="button" onClick={() => setEditing({ name: "", description: "", permissions: [] })} className={cn(buttonPrimary, "ml-3 flex-shrink-0")}>
            <Plus className="h-4 w-4" />
            New role
          </button>
        )}
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {roles.map((r) => (
            <li key={r.id} className="glass rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {r.name}
                </p>
                <span className="text-xs text-foreground/55">{r.users} person(s)</span>
              </div>
              {r.description && <p className="text-sm text-foreground/65 mb-3">{r.description}</p>}
              <ul className="flex flex-wrap gap-1.5 mb-4">
                {r.permissions.map((code) => (
                  <li key={code} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium border border-primary/20" title={code}>
                    {actionLabel(code)}
                  </li>
                ))}
                {r.permissions.length === 0 && <li className="text-xs text-foreground/50">No permissions</li>}
              </ul>
              {manage && (
                <div className="mt-auto flex gap-2">
                  <button type="button" onClick={() => setEditing({ id: r.id, name: r.name, description: r.description, permissions: r.permissions })} className={buttonGhost}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={r.users > 0}
                    title={r.users > 0 ? "Give these people another role first" : undefined}
                    onClick={() => setDeleting(r)}
                    className={cn(buttonGhost, "hover:text-red-600")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? `Edit role: ${editing.name}` : "New role"}</SheetTitle>
            <SheetDescription>Pick what people with this role may do. Changes apply to everyone with the role at once.</SheetDescription>
          </SheetHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate(
                  { id: editing.id, data: { name: editing.name.trim(), description: editing.description.trim(), permissions: editing.permissions } },
                  {
                    onSuccess: () => {
                      toast({ title: "Role saved ✅" })
                      setEditing(null)
                    },
                    onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
                  },
                )
              }}
              className="space-y-4 pb-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name *">
                  <input required maxLength={60} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Description">
                  <input maxLength={200} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <PermissionMatrix catalog={catalog} value={editing.permissions} onChange={(permissions) => setEditing({ ...editing, permissions })} />
              {editing.permissions.includes("users.manage") && (
                <p className="text-sm rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-900">
                  “Create users, change roles” makes people with this role administrators: they can change any role, including their own.
                </p>
              )}
              <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-border flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="h-11 px-4 rounded-xl glass font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={save.isPending} className={buttonPrimary}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save role
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the role “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Nobody has this role, so nothing changes for anyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Role deleted" }),
                  onError: (error) => toast({ variant: "destructive", title: "Not deleted", description: serverMessage(error, "Please try again.") }),
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

export default function UsersPage() {
  const [tab, setTab] = useState<"people" | "roles">("people")
  return (
    <>
      <PageHeader title="Users & roles" subtitle="Who can sign in to the dashboard, and what each role may do." />
      <div className="mb-5">
        <FilterTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "people", label: "People" },
            { id: "roles", label: "Roles" },
          ]}
        />
      </div>
      {tab === "people" ? <People /> : <Roles />}
    </>
  )
}
