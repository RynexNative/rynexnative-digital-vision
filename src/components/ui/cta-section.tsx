import { Link } from "react-router-dom";
import { ArrowRight, Calculator, CheckCircle2, Gem, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/features/packages/types";

const promises = ["A clear agreement before we start", "Support after launch", "Your data stays private"];

const actions = [
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Talk to a person",
    text: "Chat with us on WhatsApp, usually within minutes",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello RynexNative, I'd like to talk about a project.")}`,
  },
  { icon: <Gem className="h-5 w-5" />, title: "Choose a package", text: "Find the level that fits your business", to: "/packages" },
  { icon: <Calculator className="h-5 w-5" />, title: "Know your budget", text: "An instant price range in 2 minutes", to: "/estimate" },
];

export function CTASection() {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-14 grid lg:grid-cols-[1.1fr,1fr] gap-10 items-center" style={{ background: "var(--gradient-cta)" }}>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative text-white">
            <h2 className="text-4xl md:text-5xl font-bold font-poppins leading-tight mb-5">
              Ready to build something your clients will love?
            </h2>
            <p className="text-lg text-white/85 mb-8 max-w-lg">
              Tell us where you want to go. We will listen, recommend the right path and walk with you from the first idea to launch.
            </p>
            <ul className="space-y-3">
              {promises.map((item) => (
                <li key={item} className="flex items-center gap-3 font-semibold">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative bg-white rounded-3xl p-3 shadow-2xl shadow-emerald-900/20">
            {actions.map((action) => {
              const inner = (
                <>
                  <span className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {action.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-slate-900">{action.title}</span>
                    <span className="block text-sm text-slate-500">{action.text}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </>
              );
              const className = "group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors";
              return action.to ? (
                <Link key={action.title} to={action.to} className={className}>
                  {inner}
                </Link>
              ) : (
                <a key={action.title} href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
