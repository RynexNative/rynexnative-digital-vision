import type { ClientRef, Option } from "./types"

type Base = {
  name: string
  label: string
  hint?: string
  required?: boolean
  /** Take the full row in the two-column grid */
  wide?: boolean
  /** Only show the field when this returns true for the current values */
  showIf?: (values: Values) => boolean
}

export type Field =
  | (Base & { type: "text" | "email" | "tel" | "url" | "date" | "number"; placeholder?: string })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string })
  | (Base & { type: "lines"; placeholder?: string })
  | (Base & { type: "select"; options: Option[]; allowEmpty?: string })
  | (Base & { type: "switch" })
  | (Base & { type: "client" })
  | (Base & { type: "clients" })

export type Values = Record<string, unknown>

/** Record from the API -> values the form edits */
export function toFormValues(fields: Field[], record: Values | null, defaults: Values): Values {
  const values: Values = { ...defaults }
  if (!record) return values
  for (const field of fields) {
    const value = record[field.name]
    if (field.type === "client") values[field.name] = (value as ClientRef | null)?.id ?? ""
    else if (field.type === "clients") values[field.name] = ((value as ClientRef[]) ?? []).map((c) => c.id)
    else if (field.type === "lines") values[field.name] = ((value as string[]) ?? []).join("\n")
    else values[field.name] = value ?? (field.type === "switch" ? false : "")
  }
  return values
}

/** Form values -> request body (empty dates and numbers become null) */
export function toPayload(fields: Field[], values: Values): Values {
  const body: Values = {}
  for (const field of fields) {
    const value = values[field.name]
    if (field.type === "number") body[field.name] = value === "" || value === null || value === undefined ? null : Number(value)
    else if (field.type === "date" || field.type === "client") body[field.name] = value ? value : null
    else if (field.type === "lines") body[field.name] = String(value ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
    else if (typeof value === "string") body[field.name] = value.trim()
    else body[field.name] = value
  }
  return body
}

