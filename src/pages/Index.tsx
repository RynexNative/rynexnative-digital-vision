import { Navigation } from "@/components/ui/navigation"
import { HeroSection } from "@/components/ui/hero-section"
import { AboutSection } from "@/components/ui/about-section"
import { ServicesSection } from "@/components/ui/services-section"
import { PortfolioSection } from "@/components/ui/portfolio-section"
import { WhyChooseUsSection } from "@/components/ui/why-choose-us-section"
import { TestimonialsSection } from "@/components/ui/testimonials-section"
import { CTASection } from "@/components/ui/cta-section"
import { ContactSection } from "@/components/ui/contact-section"
import { Footer } from "@/components/ui/footer"
import { AlertsPreviewSection } from "@/components/ui/alerts-preview-section"
import { EventsNewsSection } from "@/components/ui/events-news-section"
import { usePendingSectionScroll } from "@/hooks/use-section-nav"

const Index = () => {
  usePendingSectionScroll();

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <PortfolioSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <EventsNewsSection />
      <AlertsPreviewSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;