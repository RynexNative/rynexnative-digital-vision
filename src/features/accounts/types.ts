export type Person = { id: number | null; username: string; name: string }

export type TeamUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  is_owner: boolean
  role_detail: RoleRef | null
  farm_role_detail: RoleRef | null
  /** Businesses this person works in (the category): "rynexnative", "chickenpoint" */
  workspaces: string[]
  created_by: Person | null
  created_at: string
  last_login: string | null
}

export type RoleRef = { id: number | null; name: string; workspace?: string }

export const WORKSPACE_NAMES: Record<string, string> = { rynexnative: "RynexNative", chickenpoint: "Chicken Point" }
export const WORKSPACE_PILL: Record<string, string> = {
  rynexnative: "bg-primary/10 text-primary border-primary/25",
  chickenpoint: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
}

export type Role = {
  id: number
  workspace: string
  name: string
  description: string
  permissions: string[]
  users: number
  created_by: Person | null
  created_at: string
  updated_at: string
}

export type CatalogModule = { workspace: string; key: string; label: string; description: string; actions: Record<string, string> }

export type AuditEvent = {
  id: number
  created_at: string
  actor: Person
  action: string
  module: string
  summary: string
  object_type: string
  object_id: string
  object_label: string
  changes: Record<string, [string, string]>
  method: string
  path: string
  status_code: number | null
  ip: string | null
  user_agent: string
}

export type AuditPage = { count: number; offset: number; limit: number; results: AuditEvent[] }

export const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  partial_update: "Updated",
  destroy: "Deleted",
  publish: "Published",
  unpublish: "Unpublished",
  login: "Signed in",
  logout: "Signed out",
  login_failed: "Failed sign-in",
  denied: "Refused",
  password: "Own password",
  set_password: "Password reset",
  send: "Emailed",
  convert: "Converted",
  payments: "Payment",
  delete_payment: "Payment removed",
  from_request: "Quote from request",
  deliver: "Delivered",
  cancel: "Cancelled",
  restore: "Restored",
  export: "Downloaded",
}

export const ACTION_TONE: Record<string, string> = {
  destroy: "bg-red-500/10 text-red-700 border-red-500/30",
  denied: "bg-red-500/10 text-red-700 border-red-500/30",
  login_failed: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  create: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  publish: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  login: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  logout: "bg-foreground/5 text-foreground/60 border-foreground/15",
}

/** A strong random password the administrator can copy and give to the new person. */
export function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-"
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}
