import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingShapes } from "@/components/ui/floating-shapes"
import heroImage from "@/assets/hero-image.jpg"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      <FloatingShapes />
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-slide-up">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-poppins mb-6">
            <span className="bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
              Empowering Digital
            </span>
            <br />
            <span className="text-white">Innovation</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            We build intelligent solutions for a connected world through cutting-edge 
            <span className="text-primary font-semibold"> software development</span>, 
            <span className="text-accent font-semibold"> mobile applications</span>, and 
            <span className="text-electric-teal font-semibold"> cybersecurity</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="neu-button text-lg px-8 py-4 group border-primary/20 hover:border-primary/40"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="glass text-lg px-8 py-4 group border-accent/30 hover:border-accent/50"
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              View Our Work
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="glass rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-foreground/70">Projects Delivered</div>
            </div>
            <div className="glass rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold text-accent mb-2">5+</div>
              <div className="text-sm text-foreground/70">Years Experience</div>
            </div>
            <div className="glass rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold text-electric-teal mb-2">30+</div>
              <div className="text-sm text-foreground/70">Happy Clients</div>
            </div>
            <div className="glass rounded-2xl p-6 hover-lift">
              <div className="text-3xl font-bold text-tech-purple mb-2">24/7</div>
              <div className="text-sm text-foreground/70">Support</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}