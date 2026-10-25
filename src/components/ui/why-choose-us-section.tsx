import { CheckCircle2, MessageCircle, Quote } from "lucide-react"
import FounderImage from "@/assets/founder-384.webp"
import { WHATSAPP_NUMBER } from "@/features/packages/types"
import { useTrackRecord } from "@/features/projects/api"
import { useWhyChooseUs } from "@/features/sitecontent/api"
import { ContentIcon } from "@/features/sitecontent/icons"
import { DEFAULT_WHY_CHOOSE_US, type WhyChooseUsContent } from "@/features/sitecontent/types"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const COLUMNS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }
// Written out in full so Tailwind keeps these classes
const PROMISE_COLUMNS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" }

function Numbers() {
  // The same honest totals as the Our work section, plus round-the-clock support
  const { data: record } = useTrackRecord()
  if (record && !record.show_track_record) return null
  const picked = ["projects", "clients", "team", "supported"].flatMap((key) => record?.totals.filter((t) => t.key === key) ?? []).slice(0, 3)
  const stats = [...picked, { key: "support", display: "24/7", label: "Support available" }]
  return (
    <dl className={cn("grid grid-cols-2 gap-6 text-center", COLUMNS[stats.length] ?? "md:grid-cols-4")}>
      {stats.map((stat) => (
        <div key={stat.key} className="flex flex-col-reverse">
          <dt className="text-sm text-foreground/65 mt-1">{stat.label}</dt>
          <dd className="text-3xl md:text-4xl font-bold font-poppins text-primary">{stat.display}</dd>
        </div>
      ))}
    </dl>
  )
}

/** The section itself, drawn from content. The dashboard uses it as a live preview while editing. */
export function WhyChooseUsView({ content, numbers = true }: { content: WhyChooseUsContent; numbers?: boolean }) {
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Habari RynexNative, I would like to talk about a project.")}`
  const photo = content.note_photo ? imageUrl(content.note_photo, 160) : FounderImage

  return (
    <section id="why-choose-us" className="relative py-20 md:py-28 bg-background overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {content.eyebrow && <p className="eyebrow">{content.eyebrow}</p>}
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6 leading-tight">
            {content.title} {content.highlight && <span className="text-primary">{content.highlight}</span>}
          </h2>
          {content.subtitle && <p className="text-lg md:text-xl text-foreground/75 leading-relaxed">{content.subtitle}</p>}
        </div>

        <div className={cn("grid gap-6", content.show_note && "lg:grid-cols-12")}>
          {content.show_note && (
            <figure className="lg:col-span-5 surface-dark rounded-3xl p-8 md:p-10 relative overflow-hidden lg:sticky lg:top-28 self-start">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
              <Quote className="relative h-10 w-10 text-primary mb-5" aria-hidden="true" />
              {content.note_greeting && <p className="relative text-3xl md:text-4xl font-bold font-poppins text-white mb-4">{content.note_greeting}</p>}
              <blockquote className="relative text-lg leading-relaxed text-slate-200 whitespace-pre-line">{content.note_text}</blockquote>
              <figcaption className="relative flex items-center gap-4 mt-8">
                <img src={photo} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/60" />
                <span>
                  <span className="block font-semibold text-white">{content.note_name}</span>
                  <span className="block text-sm text-slate-400">{content.note_role}</span>
                </span>
              </figcaption>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-8 h-12 px-5 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center gap-2 hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="h-5 w-5" />
                Talk to us on WhatsApp
              </a>
            </figure>
          )}

          <ul className={cn("grid sm:grid-cols-2 gap-4 md:gap-5", content.show_note ? "lg:col-span-7" : "lg:grid-cols-3")}>
            {content.reasons.map((reason) => (
              <li key={reason.title} className="group glass rounded-3xl p-6 md:p-7 flex flex-col hover-lift">
                <span className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <ContentIcon name={reason.icon} className="h-6 w-6" />
                </span>
                <h3 className="text-lg md:text-xl font-bold font-poppins mb-2">{reason.title}</h3>
                <p className="text-foreground/75 leading-relaxed text-[15px] mb-5">{reason.text}</p>
                {reason.proof && (
                  <p className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {reason.proof}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {content.promises.length > 0 && (
          <div className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-primary mb-4 text-center">Our promise to every client</p>
            <ul className={cn("grid sm:grid-cols-2 gap-x-6 gap-y-3", PROMISE_COLUMNS[content.promises.length] ?? "lg:grid-cols-4")}>
              {content.promises.map((promise) => (
                <li key={promise} className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        )}

        {numbers && content.show_numbers && (
          <div className="mt-6 glass rounded-3xl p-6 md:p-8">
            <Numbers />
          </div>
        )}
      </div>
    </section>
  )
}

export function WhyChooseUsSection() {
  const { data } = useWhyChooseUs()
  return <WhyChooseUsView content={data ?? DEFAULT_WHY_CHOOSE_US} />
}
