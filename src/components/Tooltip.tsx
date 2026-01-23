import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  disabled?: boolean
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, disabled = false, delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('right')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return

    const tooltip = tooltipRef.current
    const trigger = triggerRef.current
    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    // Determine position based on available space
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    const spaceTop = rect.top
    const spaceBottom = window.innerHeight - rect.bottom

    let newPosition: 'top' | 'bottom' | 'left' | 'right' = 'right'
    if (spaceRight < tooltipRect.width && spaceLeft > tooltipRect.width) {
      newPosition = 'left'
    } else if (spaceBottom < tooltipRect.height && spaceTop > tooltipRect.height) {
      newPosition = 'top'
    } else if (spaceTop < tooltipRect.height && spaceBottom > tooltipRect.height) {
      newPosition = 'bottom'
    }

    setPosition(newPosition)
  }, [isVisible])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-[100] px-2 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-fade-in ${
            position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
            position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
            position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
            'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900/90 transform rotate-45 ${
              position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
              position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
              'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
}
