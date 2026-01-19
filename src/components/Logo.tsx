import React from 'react'
import { Search } from 'lucide-react'

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
    sm: 'p-1 rounded-md',
    md: 'p-1 sm:p-1.5 rounded-md sm:rounded-lg',
    lg: 'p-1.5 sm:p-2 rounded-lg sm:rounded-xl'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6'
  }
  
  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl'
  }

  const containerClasses = onClick 
    ? `flex items-center gap-1.5 sm:gap-2 cursor-pointer ${className}`
    : `flex items-center gap-1.5 sm:gap-2 ${className}`

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className={`bg-blue-600 ${sizeClasses[iconSize]}`}>
        <Search className={`${iconSizes[iconSize]} text-white stroke-[3]`} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[iconSize]} tracking-tight text-slate-900`}>
          SmarTrack
        </span>
      )}
    </div>
  )
}
