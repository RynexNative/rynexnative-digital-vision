import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} border-4 border-primary/20 rounded-full animate-spin`}>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full"></div>
        </div>
        
        {/* Inner logo-inspired element */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
        </div>
        
        {/* Pulsing rings */}
        <div className="absolute inset-0 animate-pulse-ring">
          <div className={`${sizeClasses[size]} border-2 border-primary/30 rounded-full`}></div>
        </div>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-3xl p-8 flex flex-col items-center space-y-4">
        <img 
          src="/lovable-uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" 
          alt="RynexNative" 
          className="w-12 h-12 object-contain animate-pulse"
        />
        <LoadingSpinner size="lg" />
        <p className="text-foreground/70 font-medium">Loading...</p>
      </div>
    </div>
  )
}