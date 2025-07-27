import { ArrowRight, Calendar, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 right-40 w-16 h-16 bg-electric-teal rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-poppins mb-6 text-white">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Digital Vision?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Let's discuss how our expertise can accelerate your business growth through innovative technology solutions.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="neu-button text-lg px-8 py-4 group border-primary/30 hover:border-primary/50"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Calendar className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Schedule Consultation
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="glass text-lg px-8 py-4 group border-white/30 hover:border-white/50 text-white hover:text-white"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Start a Project
            </Button>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Chat</h3>
              <p className="text-white/70 text-sm mb-4">Get immediate answers to your questions</p>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Chat
              </Button>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Book a Call</h3>
              <p className="text-white/70 text-sm mb-4">30-minute strategy session</p>
              <Button 
                variant="ghost" 
                className="text-accent hover:text-accent/80 hover:bg-accent/10"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Schedule Now
              </Button>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-electric-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Started</h3>
              <p className="text-white/70 text-sm mb-4">Begin your project today</p>
              <Button 
                variant="ghost" 
                className="text-electric-teal hover:text-electric-teal/80 hover:bg-electric-teal/10"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}