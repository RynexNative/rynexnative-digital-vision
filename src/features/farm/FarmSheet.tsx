import { useState, type ReactNode } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { inputClass } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useBatches, useCustomers, useDeleteFarm, useSaveFarm, type FarmResource } from "./api"
import { ReasonDialog } from "./ReasonDialog"
import { ReceiptField } from "./ReceiptField"
import { farmButton, toBody, type FarmField, type Values } from "./form"

function Input({ field, values, set }: { field: FarmField; values: Values; set: (name: string, value: unknown) => void }) {
  const value = values[field.name]
  const needsBatches = field.type === "batch"
  const { data: batches = [] } = useBatches({ status: "open" }, needsBatches)
  const { data: customers = [] } = useCustomers({}, field.type === "customer")
  switch (field.type) {
    case "textarea":
      return <textarea rows={3} value={String(value ?? "")} placeholder={field.placeholder} onChange={(e) => set(field.name, e.target.value)} className={cn(inputClass, "resize-y text-sm")} />
    case "select":
      return (
        <select required={field.required} value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} className={inputClass}>
          {field.allowEmpty !== undefined && <option value="">{field.allowEmpty}</option>}
          {Object.entries(field.options).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      )
    case "batch": {
      // A closed batch being edited still has to show
      const current = value ? String(value) : ""
      return (
        <select required={field.required} value={current} onChange={(e) => set(field.name, e.target.value)} className={inputClass}>
          <option value="">{field.allowEmpty ?? "Choose a batch"}</option>
          {current && !batches.some((b) => String(b.id) === current) && <option value={current}>{String(values.batch_code ?? `Batch ${current}`)}</option>}
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code}
              {b.house ? ` · ${b.house}` : ""} · {b.figures.alive} alive
            </option>
          ))}
        </select>
      )
    }
    case "customer":
      return (
        <select value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} className={inputClass}>
          <option value="">{field.allowEmpty ?? "Choose a customer"}</option>
          {customers
            .filter((c) => c.is_active || String(c.id) === String(value))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      )
    case "receipt":
      return (
        <ReceiptField
          value={String(values.receipt_url ?? "")}
          name={String(values.receipt_name ?? "")}
          onChange={(url, name) => {
            set("receipt_url", url)
            set("receipt_name", name)
          }}
        />
      )
    default:
      return (
        <input
          type={field.type}
          inputMode={field.type === "number" ? "decimal" : undefined}
          step={field.type === "number" ? field.step ?? "any" : undefined}
          required={field.required}
          min={field.type === "number" ? 0 : undefined}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => set(field.name, e.target.value)}
          className={inputClass}
        />
      )
  }
}

/** A side sheet with a form for one farm record: add, edit, delete. */
export function FarmSheet({
  resource,
  title,
  description,
  fields,
  initial,
  recordId,
  onClose,
  deleteText,
  extra,
  canDelete = true,
  preview,
  onDeleted,
  onSubmit,
  submitLabel,
  pending,
}: {
  resource: FarmResource
  title: string
  description?: string
  fields: FarmField[]
  initial: Values
  recordId?: number
  onClose: () => void
  deleteText?: string
  /** Fields sent but not shown (e.g. the batch, when adding from a batch's page) */
  extra?: Values
  canDelete?: boolean
  /** Shown under the form, from the current values (e.g. the sale's total) */
  preview?: (values: Values) => ReactNode
  onDeleted?: () => void
  /** Instead of saving the record (e.g. delivering an order): receives the request body */
  onSubmit?: (body: Values) => void
  submitLabel?: string
  pending?: boolean
}) {
  const { toast } = useToast()
  const save = useSaveFarm(resource)
  const remove = useDeleteFarm(resource)
  const [values, setValues] = useState<Values>(initial)
  const [confirm, setConfirm] = useState(false)
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const visible = fields.filter((f) => !f.showIf || f.showIf(values))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) return onSubmit({ ...toBody(visible, values), ...extra })
    save.mutate(
      { id: recordId, data: { ...toBody(visible, values), ...extra } },
      {
        onSuccess: () => {
          toast({ title: recordId ? "Saved ✅" : "Recorded ✅" })
          onClose()
        },
        onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
      },
    )
  }

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <form onSubmit={submit} className="pb-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {visible.map((field) => {
                const wide = field.wide || field.type === "textarea" || field.type === "receipt"
                const body = (
                  <>
                    <span className={cn("block text-sm font-medium", field.hint ? "mb-1" : "mb-1.5")}>
                      {field.label}
                      {field.required && " *"}
                    </span>
                    {field.hint && <span className="block text-xs text-foreground/50 mb-1.5">{field.hint}</span>}
                    <Input field={field} values={values} set={set} />
                  </>
                )
                // The receipt picker has its own buttons: a <label> around it would click them twice
                return field.type === "receipt" ? (
                  <div key={field.name} className="sm:col-span-2">
                    {body}
                  </div>
                ) : (
                  <label key={field.name} className={cn("block", wide && "sm:col-span-2")}>
                    {body}
                  </label>
                )
              })}
            </div>
            {preview?.(values)}
            <div className="sticky -bottom-6 -mx-6 -mb-6 mt-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
              {recordId && canDelete ? (
                <button type="button" onClick={() => setConfirm(true)} className="h-11 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 inline-flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl glass font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={save.isPending || pending} className={farmButton}>
                  {(save.isPending || pending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitLabel ?? (recordId ? "Save" : "Record")}
                </button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {confirm && (
        <ReasonDialog
          title="Delete this record?"
          description={deleteText ?? "It disappears from the lists and the figures, but is kept under Deleted items and can be restored."}
          confirmLabel="Delete"
          keepLabel="Keep it"
          pending={remove.isPending}
          onClose={() => setConfirm(false)}
          onConfirm={(reason) =>
            recordId &&
            remove.mutate(
              { id: recordId, reason },
              {
                onSuccess: () => {
                  toast({ title: "Deleted", description: "Kept under Deleted items, where it can be restored." })
                  setConfirm(false)
                  onClose()
                  onDeleted?.()
                },
                onError: (error) => toast({ variant: "destructive", title: "Could not delete", description: serverMessage(error, "Please try again.") }),
              },
            )
          }
        />
      )}
    </>
  )
}
