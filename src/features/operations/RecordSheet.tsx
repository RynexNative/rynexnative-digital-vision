import { useState, type ReactNode } from "react"
import { Loader2, Trash2 } from "lucide-react"
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
import { buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useDeleteRecord, useOpsList, useSaveRecord, type OpsResource } from "./api"
import { toPayload, type Field, type Values } from "./form-values"
import type { OpsClient } from "./types"

function FieldInput({ field, values, set, clients }: { field: Field; values: Values; set: (name: string, value: unknown) => void; clients: OpsClient[] }) {
  const value = values[field.name]
  switch (field.type) {
    case "textarea":
    case "lines":
      return (
        <textarea
          rows={field.type === "textarea" ? field.rows ?? 3 : 4}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => set(field.name, e.target.value)}
          className={cn(inputClass, "resize-y text-sm")}
        />
      )
    case "select":
      return (
        <select required={field.required} value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} className={inputClass}>
          {field.allowEmpty !== undefined && <option value="">{field.allowEmpty}</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    case "switch":
      return (
        <span className="flex items-center gap-3 h-[46px]">
          <Switch checked={Boolean(value)} onCheckedChange={(v) => set(field.name, v)} />
          <span className="text-sm text-foreground/70">{value ? "Yes" : "No"}</span>
        </span>
      )
    case "client":
      return (
        <select required={field.required} value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} className={inputClass}>
          <option value="">{field.required ? "Choose a client" : "RynexNative (our own)"}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )
    case "clients": {
      const selected = (value as string[]) ?? []
      const toggle = (id: string) => set(field.name, selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
      return clients.length ? (
        <div className="flex flex-wrap gap-2">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={selected.includes(c.id)}
              className={cn(
                "h-9 px-3 rounded-full border text-sm transition-colors",
                selected.includes(c.id) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground/50">Add clients first to link them here.</p>
      )
    }
    default:
      return (
        <input
          type={field.type}
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

/**
 * A side sheet with a form generated from `fields`. Used for clients, services,
 * domains, servers and subscriptions so they all behave the same way.
 */
export function RecordSheet({
  resource,
  open,
  onClose,
  title,
  description,
  fields,
  initial,
  recordId,
  deleteText,
  footer,
}: {
  resource: OpsResource
  open: boolean
  onClose: () => void
  title: string
  description?: string
  fields: Field[]
  initial: Values
  recordId?: string
  deleteText?: string
  footer?: ReactNode
}) {
  const { toast } = useToast()
  const save = useSaveRecord(resource)
  const remove = useDeleteRecord(resource)
  const needsClients = fields.some((f) => f.type === "client" || f.type === "clients")
  const { data: clients = [] } = useOpsList<OpsClient>("clients", {}, needsClients)
  const [values, setValues] = useState<Values>(initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const visible = fields.filter((f) => !f.showIf || f.showIf(values))
    save.mutate(
      { id: recordId, data: toPayload(visible, values) },
      {
        onSuccess: () => {
          toast({ title: recordId ? "Saved ✅" : "Added ✅" })
          onClose()
        },
        onError: (error) =>
          toast({ variant: "destructive", title: "Could not save", description: validationMessage(error) ?? errorMessage(error, "Please try again.") }),
      },
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <form onSubmit={submit} className="pb-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {fields
                .filter((f) => !f.showIf || f.showIf(values))
                .map((field) => (
                  <label key={field.name} className={cn("block", (field.wide || field.type === "textarea" || field.type === "lines" || field.type === "clients") && "sm:col-span-2")}>
                    <span className={cn("block text-sm font-medium", field.hint ? "mb-1" : "mb-1.5")}>
                      {field.label}
                      {field.required && " *"}
                    </span>
                    {field.hint && <span className="block text-xs text-foreground/50 mb-1.5">{field.hint}</span>}
                    <FieldInput field={field} values={values} set={set} clients={clients} />
                  </label>
                ))}
            </div>
            {footer}
            <div className="sticky -bottom-6 -mx-6 -mb-6 mt-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
              {recordId ? (
                <button type="button" onClick={() => setConfirmDelete(true)} className="h-11 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 inline-flex items-center gap-1.5">
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
                <button type="submit" disabled={save.isPending} className={buttonPrimary}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {recordId ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>{deleteText ?? "It will be removed permanently. To keep the history, change its status instead."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                recordId &&
                remove.mutate(recordId, {
                  onSuccess: () => {
                    toast({ title: "Deleted" })
                    onClose()
                  },
                  onError: (error) => toast({ variant: "destructive", title: "Could not delete", description: errorMessage(error, "Please try again.") }),
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
