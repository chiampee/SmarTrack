import React from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  iconSize?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = false,
  iconSize = 'md',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 sm:w-7 sm:h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12'
  }
  
  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl'
  }

  const containerClasses = onClick 
    ? `flex items-center gap-1.5 sm:gap-2 cursor-pointer ${className}`
    : `flex items-center gap-1.5 sm:gap-2 ${className}`

  // Magnifying glass SVG component - positioned with circle upper-left, handle bottom-right
  const MagnifyingGlassIcon: React.FC<{ size: string }> = ({ size }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      {/* Circle (lens) positioned upper-left - centered at (5, 5) */}
      <circle cx="5" cy="5" r="3.5" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Handle pointing bottom-right */}
      <line x1="8" y1="8" x2="11.5" y2="11.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )

  const iconSizes = {
    sm: '14',
    md: '16',
    lg: '18'
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      {/* Blue gradient rounded square icon - gradient from lighter (top-left) to darker (bottom-right) */}
      <div 
        className={`${sizeClasses[iconSize]} rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm`}
        style={{
          background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #1E40AF 100%)'
        }}
      >
        <MagnifyingGlassIcon size={iconSizes[iconSize]} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[iconSize]} tracking-tight text-slate-800`}>
          SmarTrack
        </span>
      )}
    </div>
  )
}
