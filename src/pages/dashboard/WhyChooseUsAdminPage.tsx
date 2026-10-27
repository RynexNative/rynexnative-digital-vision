import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowDown, ArrowUp, Eye, EyeOff, Lightbulb, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { WhyChooseUsView } from "@/components/ui/why-choose-us-section"
import { useDashboardQuery } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { ErrorState, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { CONTENT_ICONS, ContentIcon } from "@/features/sitecontent/icons"
import type { Reason, WhyChooseUsContent } from "@/features/sitecontent/types"
import { useToast } from "@/hooks/use-toast"
import { dashboardRequest, serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

const MAX_REASONS = 9
const MAX_PROMISES = 6

function Field({ label, hint, count, max, children }: { label: string; hint?: string; count?: number; max?: number; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        {max !== undefined && (
          <span className={cn("text-xs tabular-nums", (count ?? 0) > max * 0.9 ? "text-amber-700" : "text-foreground/45")}>
            {count ?? 0}/{max}
          </span>
        )}
      </span>
      {hint && <span className="block text-xs text-foreground/50 -mt-1 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ReasonEditor({
  reason,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  reason: Reason
  index: number
  total: number
  onChange: (reason: Reason) => void
  onMove: (to: number) => void
  onRemove: () => void
}) {
  const set = (key: keyof Reason) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...reason, [key]: e.target.value })
  return (
    <li className="rounded-2xl border border-foreground/10 p-4 bg-card/40">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-foreground/60">Reason {index + 1}</span>
        <span className="flex gap-1">
          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)} className={cn(buttonGhost, "h-8 w-8 px-0")}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(index + 1)} className={cn(buttonGhost, "h-8 w-8 px-0")}>
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Remove reason" disabled={total === 1} onClick={onRemove} className={cn(buttonGhost, "h-8 w-8 px-0 hover:text-red-600")}>
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div role="radiogroup" aria-label="Icon" className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(CONTENT_ICONS).map(([name, { label }]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={reason.icon === name}
            aria-label={label}
            title={label}
            onClick={() => onChange({ ...reason, icon: name })}
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center border transition-colors",
              reason.icon === name ? "bg-primary text-white border-primary" : "border-foreground/10 text-foreground/60 hover:text-primary hover:border-primary/40",
            )}
          >
            <ContentIcon name={name} className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <Field label="Title" count={reason.title.length} max={60}>
          <input required maxLength={60} value={reason.title} onChange={set("title")} className={inputClass} />
        </Field>
        <Field label="What it means for the client" count={reason.text.length} max={240}>
          <textarea required rows={3} maxLength={240} value={reason.text} onChange={set("text")} className={cn(inputClass, "text-sm resize-y")} />
        </Field>
        <Field label="Proof or promise (small green label)" hint="Something you always do, e.g. Agreed in writing" count={reason.proof.length} max={40}>
          <input maxLength={40} value={reason.proof} onChange={set("proof")} className={inputClass} />
        </Field>
      </div>
    </li>
  )
}

export default function WhyChooseUsAdminPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useDashboardQuery<WhyChooseUsContent>(["dashboard", "content", "why-choose-us"], "/content/why-choose-us/")
  const [draft, setDraft] = useState<WhyChooseUsContent | null>(null)
  const [preview, setPreview] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  const saved = (content: WhyChooseUsContent, message: string) => {
    queryClient.setQueryData(["dashboard", "content", "why-choose-us"], content)
    queryClient.invalidateQueries({ queryKey: ["content", "why-choose-us"] })
    setDraft(content)
    toast({ title: message, description: "Visitors see the change within a minute." })
  }
  const save = useMutation({
    mutationFn: (content: WhyChooseUsContent) => dashboardRequest<WhyChooseUsContent>("/content/why-choose-us/", { method: "PUT", body: content }),
    onSuccess: (content) => saved(content, "Saved ✅"),
    onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
  })
  const reset = useMutation({
    mutationFn: () => dashboardRequest<WhyChooseUsContent>("/content/why-choose-us/reset/", { method: "POST" }),
    onSuccess: (content) => saved(content, "Back to the original wording"),
  })

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (isLoading || !draft) return <ListSkeleton rows={3} />

  const dirty = JSON.stringify(draft) !== JSON.stringify(data)
  const set = <K extends keyof WhyChooseUsContent>(key: K, value: WhyChooseUsContent[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d))
  const text = (key: keyof WhyChooseUsContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never)
  const setReason = (index: number, reason: Reason) => set("reasons", draft.reasons.map((r, i) => (i === index ? reason : r)))
  const moveReason = (from: number, to: number) => {
    const list = [...draft.reasons]
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item)
    set("reasons", list)
  }

  return (
    <>
      <PageHeader
        title="Why choose us"
        subtitle="The section that tells visitors why they can trust us. Speak to them warmly, and promise only what we always deliver."
        action={
          <button type="button" onClick={() => setPreview((p) => !p)} className={cn(buttonGhost, "h-11 px-4")}>
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Back to editing" : "Preview"}
          </button>
        }
      />

      {preview ? (
        <div className="rounded-3xl border border-border overflow-hidden mb-24 bg-background">
          <WhyChooseUsView content={draft} numbers={false} />
        </div>
      ) : (
        <form
          id="why-form"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate(draft)
          }}
          className="pb-24"
        >
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 mb-4 text-sm flex gap-3">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-foreground/80">
              <p>
                <b>Write to the client</b> (“you”, “your staff”), not about us. Say how it will feel to work with us.
              </p>
              <p>
                <b>Promise only what we always do.</b> No numbers we cannot prove (like “99% satisfaction”): one broken promise costs more trust than
                ten good words earn.
              </p>
            </div>
          </div>

          <Card title="Heading">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Small label above" count={draft.eyebrow.length} max={60}>
                <input maxLength={60} value={draft.eyebrow} onChange={text("eyebrow")} className={inputClass} />
              </Field>
              <div />
              <Field label="Title" count={draft.title.length} max={120}>
                <input required maxLength={120} value={draft.title} onChange={text("title")} className={inputClass} />
              </Field>
              <Field label="Green words at the end" count={draft.highlight.length} max={60}>
                <input maxLength={60} value={draft.highlight} onChange={text("highlight")} className={inputClass} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Introduction" count={draft.subtitle.length} max={400}>
                <textarea rows={3} maxLength={400} value={draft.subtitle} onChange={text("subtitle")} className={cn(inputClass, "text-sm resize-y")} />
              </Field>
            </div>
          </Card>

          <Card
            title={`Reasons to choose us (${draft.reasons.length})`}
            action={
              <button
                type="button"
                disabled={draft.reasons.length >= MAX_REASONS}
                onClick={() => set("reasons", [...draft.reasons, { icon: "heart", title: "", text: "", proof: "" }])}
                className={buttonGhost}
              >
                <Plus className="h-4 w-4" />
                Add reason
              </button>
            }
          >
            <p className="text-xs text-foreground/55 -mt-2 mb-3">Six reads best on the website. Use the arrows to put the strongest first.</p>
            <ol className="grid lg:grid-cols-2 gap-3">
              {draft.reasons.map((reason, index) => (
                <ReasonEditor
                  key={index}
                  reason={reason}
                  index={index}
                  total={draft.reasons.length}
                  onChange={(r) => setReason(index, r)}
                  onMove={(to) => moveReason(index, to)}
                  onRemove={() => set("reasons", draft.reasons.filter((_, i) => i !== index))}
                />
              ))}
            </ol>
          </Card>

          <Card
            title="Our promise to every client"
            action={
              <button
                type="button"
                disabled={draft.promises.length >= MAX_PROMISES}
                onClick={() => set("promises", [...draft.promises, ""])}
                className={buttonGhost}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            }
          >
            <p className="text-xs text-foreground/55 -mt-2 mb-3">Short lines with a green tick. Up to {MAX_PROMISES}; empty lines are dropped.</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {draft.promises.map((promise, index) => (
                <li key={index} className="flex gap-2">
                  <input
                    maxLength={60}
                    value={promise}
                    aria-label={`Promise ${index + 1}`}
                    onChange={(e) => set("promises", draft.promises.map((p, i) => (i === index ? e.target.value : p)))}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label="Remove promise"
                    onClick={() => set("promises", draft.promises.filter((_, i) => i !== index))}
                    className="h-[46px] w-10 flex-shrink-0 rounded-lg text-foreground/40 hover:text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="A personal note"
            action={<Switch checked={draft.show_note} onCheckedChange={(v) => set("show_note", v)} aria-label="Show the personal note" />}
          >
            <p className="text-xs text-foreground/55 -mt-2 mb-3">
              A few warm words from a real person make visitors feel at home. Write it in their own voice and keep it short.
            </p>
            <div className={cn("grid sm:grid-cols-2 gap-4", !draft.show_note && "opacity-50")}>
              <Field label="Greeting" count={draft.note_greeting.length} max={40}>
                <input maxLength={40} value={draft.note_greeting} onChange={text("note_greeting")} className={inputClass} />
              </Field>
              <div />
              <div className="sm:col-span-2">
                <Field label="The note" count={draft.note_text.length} max={700}>
                  <textarea rows={4} maxLength={700} value={draft.note_text} onChange={text("note_text")} className={cn(inputClass, "text-sm resize-y")} />
                </Field>
              </div>
              <Field label="Name">
                <input maxLength={80} value={draft.note_name} onChange={text("note_name")} className={inputClass} />
              </Field>
              <Field label="Role">
                <input maxLength={80} value={draft.note_role} onChange={text("note_role")} className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <ImageField value={draft.note_photo} onChange={(url) => set("note_photo", url)} label="Photo (upload one; until then the initials are shown)" />
              </div>
            </div>
          </Card>

          <Card
            title="Track record numbers under the section"
            action={<Switch checked={draft.show_numbers} onCheckedChange={(v) => set("show_numbers", v)} aria-label="Show the numbers" />}
          >
            <p className="text-sm text-foreground/60 -mt-2">The same honest totals as in Projects → On the website, plus 24/7 support.</p>
          </Card>
        </form>
      )}

      <div className="fixed bottom-16 lg:bottom-0 inset-x-0 lg:left-64 z-20 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button type="button" onClick={() => setConfirmReset(true)} className={cn(buttonGhost, "text-foreground/60")}>
            <RotateCcw className="h-4 w-4" />
            Original wording
          </button>
          <div className="flex items-center gap-3">
            {dirty && <span className="hidden sm:inline text-xs text-amber-700">Unsaved changes</span>}
            {dirty && (
              <button type="button" onClick={() => data && setDraft(data)} className="h-11 px-4 rounded-xl glass font-medium">
                Undo
              </button>
            )}
            <button type="button" disabled={!dirty || save.isPending} onClick={() => save.mutate(draft)} className={buttonPrimary}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go back to the original wording?</AlertDialogTitle>
            <AlertDialogDescription>Your edits to this section are replaced with the wording it started with.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate()}>Use original wording</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
