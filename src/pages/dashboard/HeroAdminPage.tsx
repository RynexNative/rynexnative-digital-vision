import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Loader2, RotateCcw, Save } from "lucide-react"
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
import { usePermissions } from "@/features/dashboard/access"
import { useDashboardQuery } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { ErrorState, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import type { HeroContent } from "@/features/sitecontent/types"
import { useToast } from "@/hooks/use-toast"
import { dashboardRequest, serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

function Field({ label, hint, value, max, children }: { label: string; hint?: string; value?: string; max?: number; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        {max !== undefined && (
          <span className={cn("text-xs tabular-nums", (value?.length ?? 0) > max * 0.9 ? "text-amber-700" : "text-foreground/45")}>
            {value?.length ?? 0}/{max}
          </span>
        )}
      </span>
      {hint && <span className="block text-xs text-foreground/50 -mt-1 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 mb-4">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** The top of the home page: words, "Built for …", the portrait and the uptime card. */
export default function HeroAdminPage() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useDashboardQuery<HeroContent>(["dashboard", "hero"], "/content/hero/")
  const [draft, setDraft] = useState<HeroContent | null>(null)
  const [audiences, setAudiences] = useState("")
  const [confirmReset, setConfirmReset] = useState(false)
  const manage = can("content.manage")

  useEffect(() => {
    if (data) {
      setDraft(data)
      setAudiences(data.audiences.join("\n"))
    }
  }, [data])

  const done = (saved: HeroContent, title: string) => {
    queryClient.setQueryData(["dashboard", "hero"], saved)
    queryClient.invalidateQueries({ queryKey: ["content", "hero"] })
    toast({ title, description: "The website shows it within a minute." })
  }
  const save = useMutation({
    mutationFn: (body: Partial<HeroContent>) => dashboardRequest<HeroContent>("/content/hero/", { method: "PUT", body }),
    onSuccess: (saved) => done(saved, "Hero saved ✅"),
    onError: (error) => toast({ variant: "destructive", title: "Not saved", description: serverMessage(error, "Please try again.") }),
  })
  const reset = useMutation({
    mutationFn: () => dashboardRequest<HeroContent>("/content/hero/reset/", { method: "POST" }),
    onSuccess: (saved) => done(saved, "Back to the original wording"),
    onError: (error) => toast({ variant: "destructive", title: "Not reset", description: serverMessage(error, "Please try again.") }),
  })

  if (isLoading || (!draft && !isError)) return <ListSkeleton rows={3} />
  if (isError || !draft) return <ErrorState onRetry={() => refetch()} />
  const set = <K extends keyof HeroContent>(key: K, value: HeroContent[K]) => setDraft({ ...draft, [key]: value })
  const text = (key: keyof HeroContent, max: number, label: string, hint?: string) => (
    <Field label={label} hint={hint} value={String(draft[key] ?? "")} max={max}>
      <input value={String(draft[key] ?? "")} maxLength={max} disabled={!manage} onChange={(e) => set(key, e.target.value as never)} className={inputClass} />
    </Field>
  )

  return (
    <div>
      <PageHeader
        title="Hero section"
        subtitle="The first thing visitors see on the home page, on computers and phones."
        action={
          <a href="/" target="_blank" rel="noopener" className={buttonGhost}>
            <ExternalLink className="h-4 w-4" />
            View the website
          </a>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate({ ...draft, audiences: audiences.split("\n").map((a) => a.trim()).filter(Boolean) })
        }}
      >
        <Card title="Portrait">
          <ImageField
            portrait
            value={draft.photo}
            onChange={(url) => set("photo", url)}
            label="Photo of a person (optional)"
            hint="Leave empty to keep the portrait that comes with the website. To change it: a PNG with a transparent background, standing, from the head to the hips (at least 900 px tall)."
          />
          {text("photo_alt", 120, "Describe the photo", "Read aloud to blind visitors, e.g. “Amina, our project manager”")}
        </Card>

        <Card title="Words">
          {text("eyebrow", 60, "Small label above the title")}
          {text("eyebrow_mobile", 40, "Small label on phones", "Shorter, so it fits on one line")}
          {text("title", 60, "Title, first line (white)")}
          {text("highlight", 60, "Title, second line (green)")}
          <Field label="Text under the title" hint="Put ** around the words to show in bold, e.g. We build **websites and apps**" value={draft.subtitle} max={300}>
            <textarea rows={3} value={draft.subtitle} maxLength={300} disabled={!manage} onChange={(e) => set("subtitle", e.target.value)} className={cn(inputClass, "resize-y")} />
          </Field>
          {text("subtitle_mobile", 160, "Text under the title on phones", "Shorter version of the text above")}
          <Field label="“Built for …” (one per line)" hint="Turns through these every few seconds, e.g. schools, hospitals, SACCOS & banks">
            <textarea rows={6} value={audiences} disabled={!manage} onChange={(e) => setAudiences(e.target.value)} className={cn(inputClass, "resize-y")} />
          </Field>
          {text("trust_line", 120, "Who we work with", "Shown beside the number of organisations, which comes from your real client records")}
        </Card>

        <Card title="Uptime card (computers only)">
          <label className="flex items-start justify-between gap-3 rounded-xl border border-foreground/10 p-4 cursor-pointer">
            <span>
              <span className="font-medium block">Show the uptime card</span>
              <span className="block text-xs text-foreground/60 mt-0.5">Only keep it on if the figure is true for the systems you look after.</span>
            </span>
            <Switch checked={draft.show_uptime} disabled={!manage} onCheckedChange={(v) => set("show_uptime", v)} aria-label="Show the uptime card" />
          </label>
          {draft.show_uptime && (
            <div className="grid sm:grid-cols-2 gap-4">
              {text("uptime_value", 12, "Figure", "e.g. 99.9%")}
              {text("uptime_label", 40, "Under the figure")}
            </div>
          )}
        </Card>

        {manage && (
          <div className="sticky bottom-20 lg:bottom-4 z-20 flex flex-wrap justify-between gap-2 rounded-2xl border border-border bg-background/95 backdrop-blur p-3">
            <button type="button" onClick={() => setConfirmReset(true)} className={buttonGhost}>
              <RotateCcw className="h-4 w-4" />
              Original wording
            </button>
            <button type="submit" disabled={save.isPending} className={buttonPrimary}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}
      </form>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go back to the original wording?</AlertDialogTitle>
            <AlertDialogDescription>The texts, “Built for …” list and uptime card return to the original design. The photo stays.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate()}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
