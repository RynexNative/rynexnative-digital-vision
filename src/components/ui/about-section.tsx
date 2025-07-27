import { Shield, Zap, Users, Target } from "lucide-react"

export function AboutSection() {
  const values = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Innovation First",
      description: "We stay ahead of technology trends to deliver cutting-edge solutions."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Security Focused",
      description: "Every solution is built with robust security and data protection in mind."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Client-Centered",
      description: "Your success is our priority. We build lasting partnerships."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Results Driven",
      description: "We deliver measurable outcomes that drive business growth."
    }
  ]

  return (
    <section id="about" className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">RynexNative</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            We build intelligent solutions for a connected world
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold font-poppins text-foreground">
              Pioneering the Future of Technology
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Founded with a vision to bridge the gap between innovative technology and practical business solutions, 
              RynexNative has emerged as a trusted partner for organizations seeking digital transformation.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Our team of seasoned developers, cybersecurity experts, and AI specialists work collaboratively 
              to deliver solutions that not only meet today's needs but anticipate tomorrow's challenges.
            </p>
            <div className="flex items-center space-x-4 pt-4">
              <div className="w-16 h-1 bg-gradient-primary rounded"></div>
              <span className="text-primary font-semibold">Since 2019</span>
            </div>
          </div>

          <div className="relative">
            <div className="glass rounded-3xl p-8 space-y-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-primary mb-4">Our Mission</h4>
                <p className="text-foreground/80 leading-relaxed">
                  To empower businesses with innovative technology solutions that drive growth, 
                  enhance security, and create meaningful digital experiences for users worldwide.
                </p>
              </div>
              <div className="border-t border-foreground/10 pt-6">
                <h4 className="text-2xl font-bold text-accent mb-4 text-center">Our Vision</h4>
                <p className="text-foreground/80 leading-relaxed text-center">
                  To become the leading technology partner that transforms ideas into 
                  reality and shapes the future of digital innovation.
                </p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-primary/20 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div 
              key={index} 
              className="glass rounded-2xl p-6 text-center hover-lift group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-white">
                  {value.icon}
                </div>
              </div>
              <h4 className="text-xl font-semibold font-poppins mb-3 text-foreground">
                {value.title}
              </h4>
              <p className="text-foreground/70 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}