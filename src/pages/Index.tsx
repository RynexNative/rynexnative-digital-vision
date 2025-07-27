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

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <PortfolioSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;