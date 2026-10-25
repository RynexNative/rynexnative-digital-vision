import { Award, Clock, Users, Lightbulb, Shield, Rocket } from "lucide-react"
import { useTrackRecord } from "@/features/projects/api"

const TONES = ["text-primary", "text-accent", "text-electric-teal", "text-tech-purple"]
const COLUMNS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }

export function WhyChooseUsSection() {
  // The same honest totals as the Our work section, plus round-the-clock support
  const { data: record } = useTrackRecord()
  const picked = ["projects", "clients", "team", "supported"].flatMap((key) => record?.totals.filter((t) => t.key === key) ?? []).slice(0, 3)
  const stats = [...picked, { key: "support", display: "24/7", label: "Support available" }].map((t, i) => ({
    value: t.display,
    label: t.label,
    tone: TONES[i % TONES.length],
  }))
  const strengths = [
    {
      icon: <Award className="h-8 w-8" />,
      title: "Experienced Team",
      description: "Our team of 15+ senior developers and architects bring years of industry expertise to every project.",
      stats: "5+ Years Average Experience"
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Scalable Solutions",
      description: "We build with growth in mind, ensuring your technology scales seamlessly with your business.",
      stats: "99.9% Uptime Guarantee"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Client-Centered Design",
      description: "Your success drives our approach. We collaborate closely to understand and exceed expectations.",
      stats: "98% Client Satisfaction"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Agile Delivery",
      description: "Fast iterations, transparent communication, and on-time delivery using proven agile methodologies.",
      stats: "2-Week Sprint Cycles"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Security First",
      description: "Every solution is built with enterprise-grade security standards and compliance requirements.",
      stats: "Zero Security Breaches"
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Innovation Focus",
      description: "We stay ahead of technology trends to provide cutting-edge solutions that give you a competitive edge.",
      stats: "Latest Tech Stack"
    }
  ]

  return (
    <section id="why-choose-us" className="py-20 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="eyebrow">Why RynexNative</p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Why Choose <span className="text-primary">RynexNative?</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            We combine technical excellence with business insight to deliver solutions that drive real results
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {strengths.map((strength, index) => (
            <div 
              key={index}
              className="group glass rounded-3xl p-8 hover-lift relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">
                    {strength.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold font-poppins mb-4 text-foreground group-hover:text-primary transition-colors">
                  {strength.title}
                </h3>
                
                <p className="text-foreground/80 leading-relaxed mb-6">
                  {strength.description}
                </p>

                {/* Stats */}
                <div className="pt-4 border-t border-foreground/10">
                  <div className="text-sm font-semibold text-primary">
                    {strength.stats}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 glass rounded-3xl p-8">
          <div className={`grid grid-cols-2 gap-8 text-center ${COLUMNS[stats.length] ?? "md:grid-cols-4"}`}>
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className={`text-4xl font-bold mb-2 ${stat.tone}`}>{stat.value}</div>
                <div className="text-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}