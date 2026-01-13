import { useState, useEffect } from 'react'

/**
 * Hook to detect if the SmarTrack Chrome extension is installed
 * Uses multiple detection methods for reliability
 * @returns {boolean} true if extension is detected, false otherwise
 */
export const useExtensionDetection = (): boolean => {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState<boolean>(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    let messageListener: ((event: MessageEvent) => void) | null = null

    // Method 1: Try to detect via content script message
    const detectViaMessage = () => {
      return new Promise<boolean>((resolve) => {
        const messageId = `extension-check-${Date.now()}-${Math.random()}`
        let resolved = false

        const handleMessage = (event: MessageEvent) => {
          // Security: Only accept messages from same origin
          if (event.origin !== window.location.origin) {
            return
          }

          const { type, messageId: responseId } = event.data || {}

          // Check if this is a response to our detection message
          // The extension responds with SRT_AUTH_TOKEN_RESPONSE even if no token is available
          if (type === 'SRT_AUTH_TOKEN_RESPONSE' && responseId === messageId) {
            if (!resolved) {
              resolved = true
              cleanup()
              resolve(true)
            }
          }
        }

        const cleanup = () => {
          if (messageListener) {
            window.removeEventListener('message', messageListener)
            messageListener = null
          }
        }

        messageListener = handleMessage
        window.addEventListener('message', messageListener)

        // Send detection message - extension content script listens for this
        window.postMessage(
          {
            type: 'SRT_REQUEST_AUTH_TOKEN',
            messageId: messageId
          },
          window.location.origin
        )

        // Timeout after 2 seconds (give extension time to respond)
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true
            cleanup()
            resolve(false)
          }
        }, 2000)
      })
    }

    // Method 2: Check for injected markers (if extension adds any)
    const detectViaMarkers = (): boolean => {
      // Check if extension has injected any global markers
      // This is a fallback method
      return false
    }

    // Run detection
    const runDetection = async () => {
      try {
        // Try message-based detection first
        const detected = await detectViaMessage()
        
        if (detected) {
          setIsExtensionInstalled(true)
        } else {
          // Fallback to marker detection
          const markerDetected = detectViaMarkers()
          setIsExtensionInstalled(markerDetected)
        }
      } catch (error) {
        console.debug('[Extension Detection] Error:', error)
        setIsExtensionInstalled(false)
      }
    }

    // Small delay to ensure page is fully loaded
    const detectionTimeout = setTimeout(runDetection, 500)

    // Cleanup
    return () => {
      if (detectionTimeout) {
        clearTimeout(detectionTimeout)
      }
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
    }
  }, [])

  // Return false while checking (to avoid showing button during detection)
  // Return true only if extension is confirmed installed
  return isExtensionInstalled
}
