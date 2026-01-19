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

  // Magnifying glass SVG component
  const MagnifyingGlassIcon: React.FC<{ size: string }> = ({ size }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      {/* Circle (lens) positioned upper-left */}
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Handle pointing bottom-right */}
      <line x1="8.5" y1="8.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )

  const iconSizes = {
    sm: '12',
    md: '14',
    lg: '16'
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      {/* Blue gradient rounded square icon */}
      <div className={`${sizeClasses[iconSize]} rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center`}>
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
