import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clock, Gem, Heart, LifeBuoy, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useToast } from "@/hooks/use-toast"
import { RichText } from "@/features/content/RichText"
import { usePackage, usePackages, useRequestPackage } from "@/features/packages/api"
import { BonusNote, PackageCard, PackagePrice, ProcessSteps, TrustPromises } from "@/features/packages/components"
import {
  CONTACT_OPTIONS,
  PACKAGE_CATEGORIES,
  packageWhatsAppLink,
  type InquiryInput,
  type PreferredContact,
  type ServicePackage,
} from "@/features/packages/types"
import { errorMessage, validationMessage } from "@/lib/api"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"

const EMPTY: InquiryInput = { name: "", phone: "", email: "", company: "", message: "", preferred_contact: "whatsapp", website: "" }

function RequestForm({ pkg }: { pkg: ServicePackage }) {
  const { toast } = useToast()
  const request = useRequestPackage(pkg.slug)
  const [form, setForm] = useState(EMPTY)
  const [sentAs, setSentAs] = useState<string | null>(null)
  const set = (key: keyof InquiryInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  if (sentAs !== null) {
    return (
      <div className="text-center py-2" aria-live="polite">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold font-poppins mb-2">Thank you{sentAs ? `, ${sentAs}` : ""}!</h3>
        <p className="text-sm text-foreground/70 mb-5">
          We received your request for <strong>{pkg.name}</strong>. A member of our team will contact you within one working day.
        </p>
        <a
          href={packageWhatsAppLink(pkg, sentAs)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-12 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-5 w-5" />
          Can't wait? Message us now
        </a>
      </div>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    request.mutate(
      { ...form, name, email: form.email.trim(), company: form.company.trim(), message: form.message.trim() },
      {
        onSuccess: () => setSentAs(name.split(" ")[0]),
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "Your request was not sent",
            description: validationMessage(error) ?? errorMessage(error, "Please try again, or message us on WhatsApp."),
          }),
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Your name *</span>
        <input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Phone / WhatsApp *</span>
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="07XX XXX XXX"
          value={form.phone}
          onChange={set("phone")}
          className={inputClass}
        />
      </label>
      <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Email</span>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            required={form.preferred_contact === "email"}
            value={form.email}
            onChange={set("email")}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Business</span>
          <input autoComplete="organization" maxLength={100} value={form.company} onChange={set("company")} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">
          Tell us about your goals <span className="text-foreground/50 font-normal">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={2000}
          value={form.message}
          onChange={set("message")}
          placeholder="What would you like to achieve? Any deadline?"
          className={cn(inputClass, "h-auto py-2.5 resize-y")}
        />
      </label>
      <fieldset>
        <legend className="block text-sm font-medium mb-1.5">How should we reach you?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(CONTACT_OPTIONS) as PreferredContact[]).map((option) => (
            <label
              key={option}
              className={cn(
                "h-10 rounded-xl border text-sm font-medium flex items-center justify-center cursor-pointer transition-colors",
                form.preferred_contact === option ? "border-primary bg-primary/10 text-primary" : "border-foreground/15 hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="preferred_contact"
                value={option}
                checked={form.preferred_contact === option}
                onChange={() => setForm((f) => ({ ...f, preferred_contact: option }))}
                className="sr-only"
              />
              {CONTACT_OPTIONS[option]}
            </label>
          ))}
        </div>
      </fieldset>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} className="hidden" />
      <button
        type="submit"
        disabled={request.isPending}
        className="w-full h-12 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
      >
        {request.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Request this package
      </button>
      <p className="text-xs text-foreground/60 text-center">No payment now. We will talk first and confirm everything in writing.</p>
    </form>
  )
}

export default function PackageDetailPage() {
  const { slug = "" } = useParams()
  const { data: pkg, isLoading, isError } = usePackage(slug)
  const { data: all = [] } = usePackages()
  useDocumentTitle(pkg ? `${pkg.name} · Packages` : "Packages")

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse" aria-busy="true">
          <div className="h-10 w-2/3 bg-foreground/10 rounded mb-4" />
          <div className="h-5 w-1/2 bg-foreground/10 rounded mb-10" />
          <div className="h-72 rounded-3xl bg-foreground/10" />
        </div>
      </SiteLayout>
    )
  }

  if (isError || !pkg) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <Gem className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-poppins mb-3">Package not found</h1>
          <p className="text-foreground/70 mb-8">It may have been updated or replaced.</p>
          <Link to="/packages" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />
            See all packages
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const siblings = all.filter((p) => p.category === pkg.category && p.id !== pkg.id)
  const facts = [
    pkg.delivery_time && { icon: <Clock className="h-5 w-5" />, label: "Delivery", value: pkg.delivery_time },
    pkg.support && { icon: <LifeBuoy className="h-5 w-5" />, label: "Support", value: pkg.support },
    pkg.guarantee && { icon: <ShieldCheck className="h-5 w-5" />, label: "Our promise", value: pkg.guarantee },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  return (
    <SiteLayout>
      <section className="surface-dark page-hero relative overflow-hidden">
        {pkg.cover_image && <img src={imageUrl(pkg.cover_image, 1600)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/packages" className="hover:text-primary">Packages</Link>
          </nav>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-semibold">{PACKAGE_CATEGORIES[pkg.category]}</span>
            {pkg.tier && <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground/80 text-sm">{pkg.tier}</span>}
            {pkg.badge && <span className="px-3 py-1 rounded-full bg-gradient-primary text-white text-sm font-semibold">{pkg.badge}</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-poppins text-foreground leading-tight max-w-3xl mb-4">{pkg.name}</h1>
          {pkg.tagline && <p className="text-lg md:text-xl text-foreground/75 max-w-3xl">{pkg.tagline}</p>}
          {pkg.audience && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-foreground/70">
              <Heart className="h-4 w-4 text-primary" />
              Made for: {pkg.audience}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 grid lg:grid-cols-[1fr,400px] gap-10 items-start">
        <div className="min-w-0 space-y-12">
          {facts.length > 0 && (
            <ul className="grid sm:grid-cols-3 gap-3">
              {facts.map((fact) => (
                <li key={fact.label} className="glass rounded-2xl p-4">
                  <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">{fact.icon}</span>
                  <p className="text-xs text-foreground/55">{fact.label}</p>
                  <p className="text-sm font-semibold">{fact.value}</p>
                </li>
              ))}
            </ul>
          )}

          {pkg.features.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-poppins mb-4">What's included</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex gap-3 rounded-xl bg-card/40 border border-foreground/10 p-3.5">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pkg.experience.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-poppins mb-4">What you'll experience</h2>
              <ul className="space-y-3">
                {pkg.experience.map((item) => (
                  <li key={item} className="flex gap-3 text-lg">
                    <Heart className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <span className="text-foreground/85">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pkg.description && (
            <section>
              <h2 className="text-2xl font-bold font-poppins mb-2">About this package</h2>
              <RichText text={pkg.description} className="text-lg leading-relaxed text-foreground/85" />
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold font-poppins mb-4">How we work together</h2>
            <ProcessSteps narrow />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4" id="request">
          <div className="glass rounded-3xl p-6 border-primary/30">
            <PackagePrice pkg={pkg} size="lg" />
            <BonusNote pkg={pkg} className="mt-4" />
            <div className="border-t border-foreground/10 my-5" />
            <h2 className="text-lg font-bold font-poppins mb-1">Let's talk about your project</h2>
            <p className="text-sm text-foreground/65 mb-4">Leave your details and we will reach out personally.</p>
            <RequestForm pkg={pkg} />
          </div>
          <a
            href={packageWhatsAppLink(pkg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl glass font-semibold inline-flex items-center justify-center gap-2 hover:text-[#25D366]"
          >
            <MessageCircle className="h-5 w-5" />
            Prefer WhatsApp? Chat with us
          </a>
        </aside>
      </div>

      <section className="border-t border-foreground/10 bg-card/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl md:text-3xl font-bold font-poppins mb-8 text-center">What you can count on</h2>
          <TrustPromises />
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl md:text-3xl font-bold font-poppins mb-10 text-center">Compare other levels</h2>
          <div className={cn("grid gap-6 pt-4", siblings.length === 1 ? "max-w-md mx-auto" : "md:grid-cols-2 lg:grid-cols-3")}>
            {siblings.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  )
}
