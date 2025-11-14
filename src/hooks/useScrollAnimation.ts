import { useEffect, useRef, useState } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px 0px -100px 0px', triggerOnce = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentElement = elementRef.current
    if (!currentElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (triggerOnce && currentElement) {
              observer.unobserve(currentElement)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(currentElement)

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [threshold, rootMargin, triggerOnce])

  return { elementRef, isVisible }
}

