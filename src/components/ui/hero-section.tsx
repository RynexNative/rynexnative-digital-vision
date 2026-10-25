import { Link } from "react-router-dom";
import { ArrowRight, Gem } from "lucide-react";
import hero800 from "@/assets/hero-800.webp";
import hero1600 from "@/assets/hero-1600.webp";
import { useSectionNav } from "@/hooks/use-section-nav";
import { NetworkBackground } from "@/components/ui/network-background";
import { useTrackRecord } from "@/features/projects/api";


const stack = ["React", "Django", "Python", "React Native", "Node.js", "PostgreSQL", "FastAPI", "Docker", "AWS", "TensorFlow"];

export function HeroSection() {
  const goToSection = useSectionNav();
  // Real totals from our client records (rounded down by the server); never a made-up number
  const { data: record, isLoading } = useTrackRecord();
  const total = (key: string) => record?.totals.find((t) => t.key === key)?.display;
  const stats = [
    { value: total("projects"), label: "Projects delivered" },
    { value: total("clients"), label: "Organisations served" },
    { value: "24/7", label: "Support" },
  ].filter((stat) => stat.value || isLoading);

  return (
    <section className="surface-dark relative min-h-[100svh] flex flex-col overflow-hidden">
      {/* Photo under a dark wash keeps the white text readable; it slowly zooms and drifts */}
      <img
        src={hero1600}
        srcSet={`${hero800} 800w, ${hero1600} 1600w`}
        sizes="100vw"
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-20 animate-ken-burns will-change-transform"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-950" aria-hidden="true" />
      {/* Soft green lights that wander behind the content */}
      <div className="absolute -top-56 left-1/2 h-[720px] w-[1100px] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.28),transparent)] animate-aurora will-change-transform" aria-hidden="true" />
      <div className="absolute top-1/4 -left-60 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.14),transparent)] animate-aurora-slow will-change-transform" aria-hidden="true" />
      <div className="absolute -bottom-40 -right-52 h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.14),transparent)] animate-aurora-reverse will-change-transform" aria-hidden="true" />
      <NetworkBackground className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center animate-slide-up">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-8">
            Software · Mobile · Cybersecurity
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold font-poppins leading-[1.08] text-white mb-6">
            Technology your business
            <br className="hidden sm:block" /> can <span className="text-emerald-400">trust</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-slate-300 mb-10">
            We design and build websites, apps and secure systems with care, so your clients feel the quality from the very first click.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/packages"
              className="h-14 px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold inline-flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-colors group"
            >
              <Gem className="h-5 w-5" />
              Explore our packages
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              type="button"
              onClick={() => goToSection("portfolio")}
              className="h-14 px-8 rounded-full border border-white/25 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              See our work
            </button>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl sm:text-4xl md:text-5xl font-bold font-poppins text-white min-w-[2ch] text-center">{stat.value ?? "\u00a0"}</dd>
                <span className="hidden sm:block h-10 w-px bg-emerald-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center sm:text-left sm:w-24 leading-tight" aria-hidden="true">
                  {stat.label}
                </span>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Technologies strip */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-6 overflow-hidden">
          <p className="flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight border-r border-white/15 pr-6">
            Built
            <br />
            with
          </p>
          <div className="flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-10 w-max animate-marquee">
              {[...stack, ...stack].map((name, i) => (
                <span key={i} className="text-lg font-semibold text-slate-400/80 whitespace-nowrap" aria-hidden={i >= stack.length}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
