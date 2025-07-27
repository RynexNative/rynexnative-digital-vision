import { ExternalLink, Github } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PortfolioSection() {
  const projects = [
    {
      title: "FinTech Mobile App",
      category: "Mobile Development",
      description: "A secure financial application with biometric authentication, real-time transactions, and advanced analytics.",
      tech: ["React Native", "Node.js", "MongoDB", "AWS"],
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop",
      gradient: "from-primary to-accent"
    },
    {
      title: "E-Commerce Platform",
      category: "Web Development",
      description: "Scalable e-commerce solution with AI-powered recommendations and integrated payment processing.",
      tech: ["React", "Python", "PostgreSQL", "Stripe"],
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
      gradient: "from-accent to-electric-teal"
    },
    {
      title: "Cybersecurity Dashboard",
      category: "Security Solutions",
      description: "Real-time threat monitoring dashboard with AI-powered anomaly detection and automated response systems.",
      tech: ["Vue.js", "Python", "TensorFlow", "Docker"],
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop",
      gradient: "from-electric-teal to-tech-purple"
    },
    {
      title: "IoT Smart Building",
      category: "IoT Development",
      description: "Comprehensive smart building management system with energy optimization and predictive maintenance.",
      tech: ["Angular", "Python", "InfluxDB", "MQTT"],
      image: "https://images.unsplash.com/photo-1518309312-6b3b9c4c6ab6?w=800&h=600&fit=crop",
      gradient: "from-tech-purple to-cyber-blue"
    },
    {
      title: "Healthcare AI Platform",
      category: "AI & Machine Learning",
      description: "Medical diagnosis assistance platform using machine learning for pattern recognition and decision support.",
      tech: ["React", "TensorFlow", "Python", "GCP"],
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
      gradient: "from-cyber-blue to-primary"
    },
    {
      title: "Cloud Migration Suite",
      category: "Cloud Solutions",
      description: "Enterprise cloud migration toolkit with automated deployment and monitoring capabilities.",
      tech: ["Terraform", "Kubernetes", "AWS", "Jenkins"],
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
      gradient: "from-primary to-tech-purple"
    }
  ]

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Featured <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Projects</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Showcasing our expertise through successful implementations across various industries
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div 
              key={index}
              className="group glass rounded-3xl overflow-hidden hover-lift cursor-pointer"
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-semibold text-foreground">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold font-poppins mb-3 text-foreground group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-foreground/80 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 glass border-primary/30"
                    onClick={() => window.open('#', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 glass border-accent/30"
                    onClick={() => window.open('#', '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-foreground/80 mb-6">
            Interested in seeing more of our work?
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="glass border-primary/30 px-8 py-4"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Full Portfolio
          </Button>
        </div>
      </div>
    </section>
  )
}