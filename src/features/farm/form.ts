export type Values = Record<string, unknown>

type Base = { name: string; label: string; hint?: string; required?: boolean; wide?: boolean; showIf?: (v: Values) => boolean }
export type FarmField =
  | (Base & { type: "text" | "tel" | "date" | "number"; placeholder?: string; step?: string })
  | (Base & { type: "textarea"; placeholder?: string })
  | (Base & { type: "select"; options: Record<string, string>; allowEmpty?: string })
  /** An open batch (or "none" when allowEmpty is given) */
  | (Base & { type: "batch"; allowEmpty?: string })
  | (Base & { type: "customer"; allowEmpty?: string })
  /** Sets receipt_url and receipt_name */
  | (Base & { type: "receipt" })

export const farmButton =
  "h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"

/** Form values -> request body: empty numbers, dates and links become null. */
export function toBody(fields: FarmField[], values: Values): Values {
  const body: Values = {}
  for (const field of fields) {
    if (field.type === "receipt") {
      body.receipt_url = values.receipt_url ?? ""
      body.receipt_name = values.receipt_name ?? ""
      continue
    }
    const value = values[field.name]
    const empty = value === "" || value === null || value === undefined
    if (field.type === "number" || field.type === "batch" || field.type === "customer") body[field.name] = empty ? null : Number(value)
    else if (field.type === "date") body[field.name] = empty ? null : value
    else body[field.name] = typeof value === "string" ? value.trim() : value
  }
  return body
}

/** Record from the API -> form values */
export function toValues(fields: FarmField[], record: Values | null | undefined, defaults: Values = {}): Values {
  const values: Values = { ...defaults }
  if (!record) return values
  for (const field of fields) {
    if (field.type === "receipt") {
      values.receipt_url = record.receipt_url ?? ""
      values.receipt_name = record.receipt_name ?? ""
    } else values[field.name] = record[field.name] ?? ""
  }
  values.batch_code = record.batch_code
  return values
}
