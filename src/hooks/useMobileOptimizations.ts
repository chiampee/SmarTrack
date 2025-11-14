import { useEffect, useState } from 'react'

export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    checkMobile()
    mediaQuery.addEventListener('change', handleChange)

    // Handle resize
    window.addEventListener('resize', checkMobile)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return {
    isMobile,
    prefersReducedMotion,
    // Optimized animation settings for mobile
    animationConfig: {
      duration: isMobile ? 0.4 : 0.6,
      staggerDelay: isMobile ? 0.05 : 0.08,
      movementDistance: isMobile ? 20 : 30,
      scaleAmount: isMobile ? 0.95 : 0.85,
    }
  }
}

