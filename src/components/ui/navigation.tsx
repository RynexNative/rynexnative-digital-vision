import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Calculator, CalendarDays, Gem, Menu, Newspaper, ShieldAlert, X } from "lucide-react";
import { useSectionNav } from "@/hooks/use-section-nav";
import { cn } from "@/lib/utils";

type NavItem = { label: string; section: string } | { label: string; to: string; icon: ReactNode };

const navItems: NavItem[] = [
  { label: "About", section: "about" },
  { label: "Services", section: "services" },
  { label: "Packages", to: "/packages", icon: <Gem className="h-4 w-4" /> },
  { label: "Events", to: "/events", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "News", to: "/news", icon: <Newspaper className="h-4 w-4" /> },
  { label: "Alerts", to: "/alerts", icon: <ShieldAlert className="h-4 w-4" /> },
  { label: "Contact", section: "contact" },
];

const itemClassName =
  "text-white/75 hover:text-white px-3 py-2 rounded-full text-[13px] font-semibold uppercase tracking-wider transition-colors duration-200 hover:bg-white/10";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const goToSection = useSectionNav();
  const { pathname } = useLocation();

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // A marker at the top of the page tells us when the visitor has scrolled. An observer
  // reports this after layout, so unlike reading window.scrollY it never forces a reflow.
  const topMarker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const marker = topMarker.current;
    if (!marker) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  const renderItem = (item: NavItem, mobile: boolean) => {
    const className = cn(itemClassName, mobile && "flex w-full text-left text-sm py-3 rounded-xl");
    if ("to" in item) {
      const active = pathname.startsWith(item.to);
      return (
        <Link
          key={item.label}
          to={item.to}
          aria-current={active ? "page" : undefined}
          className={cn(className, "inline-flex items-center gap-1.5", active && "text-emerald-300 bg-white/10")}
        >
          {mobile && item.icon}
          {item.label}
        </Link>
      );
    }
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          goToSection(item.section);
          setIsOpen(false);
        }}
        className={className}
      >
        {item.label}
      </button>
    );
  };

  return (
    <>
    <div ref={topMarker} className="absolute top-0 left-0 h-6 w-px pointer-events-none" aria-hidden="true" />
    <nav className="fixed top-3 md:top-4 inset-x-0 z-50 px-3 md:px-6" aria-label="Main">
      <div
        className={cn(
          "max-w-6xl mx-auto rounded-[28px] border border-white/10 backdrop-blur-xl transition-all duration-300",
          scrolled || isOpen ? "bg-slate-900/90 shadow-2xl shadow-slate-900/20" : "bg-slate-900/55",
        )}
      >
        <div className="flex justify-between items-center h-16 pl-2.5 pr-2.5 md:pl-3">
          <Link
            to="/"
            onClick={() => pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex-shrink-0 flex items-center gap-2 h-11 pl-2 pr-4 rounded-full bg-white shadow-sm"
          >
            <img src="/logo-64.webp" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-base font-extrabold font-poppins tracking-tight text-slate-900">
              Rynex<span className="text-emerald-600">Native</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-0.5">{navItems.map((item) => renderItem(item, false))}</div>

          <div className="flex items-center gap-2">
            <Link
              to="/estimate"
              className="hidden sm:inline-flex h-11 px-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold uppercase tracking-wider items-center gap-2 transition-colors"
            >
              <Calculator className="h-4 w-4" />
              Get estimate
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="xl:hidden h-11 w-11 rounded-full text-white hover:bg-white/10 flex items-center justify-center"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="xl:hidden px-3 pb-4 space-y-1 border-t border-white/10 pt-3 max-h-[calc(100svh-6rem)] overflow-y-auto">
            {navItems.map((item) => renderItem(item, true))}
            <Link
              to="/estimate"
              className="sm:hidden mt-2 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Get estimate
            </Link>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
