export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-6 h-6 bg-accent/30 rotate-45 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-60 left-1/4 w-3 h-3 bg-electric-teal/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-40 right-10 w-5 h-5 bg-tech-purple/30 rotate-12 animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute bottom-20 left-20 w-4 h-4 bg-cyber-blue/25 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-32 right-1/3 w-2 h-2 bg-primary/50 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      
      {/* Larger floating elements */}
      <div className="absolute top-10 right-10 w-16 h-16 bg-gradient-primary/10 rounded-2xl rotate-12 animate-float" style={{ animationDelay: '2.5s' }} />
      <div className="absolute bottom-10 left-10 w-12 h-12 bg-gradient-card/20 rounded-xl rotate-45 animate-float" style={{ animationDelay: '4s' }} />
    </div>
  )
}