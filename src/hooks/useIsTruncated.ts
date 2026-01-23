import { useState, useEffect, RefObject } from 'react'

/**
 * Hook to detect if an element's text is truncated
 * Compares scrollWidth (full content width) with clientWidth (visible width)
 */
export const useIsTruncated = (ref: RefObject<HTMLElement>): boolean => {
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const checkTruncation = () => {
      if (ref.current) {
        const element = ref.current
        // Check if content overflows (truncated)
        setIsTruncated(element.scrollWidth > element.clientWidth)
      }
    }

    // Check on mount and when content might change
    checkTruncation()

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(checkTruncation)
    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    // Also listen to window resize
    window.addEventListener('resize', checkTruncation)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkTruncation)
    }
  }, [ref])

  return isTruncated
}
