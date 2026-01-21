import { useState, useEffect, useRef } from 'react'

/**
 * Hook to detect if the SmarTrack Chrome extension is installed and get its version
 * Uses multiple detection methods for reliability
 * @returns {object} Object with isExtensionInstalled boolean and extensionVersion string
 */
export interface ExtensionDetectionResult {
  isExtensionInstalled: boolean
  extensionVersion: string | null
}

export const useExtensionDetection = (): ExtensionDetectionResult => {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState<boolean>(false)
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null)
  const detectionAttemptsRef = useRef(0)
  const isDetectedRef = useRef(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    let messageListener: ((event: MessageEvent) => void) | null = null

    // Method 1: Try to detect via content script message
    const detectViaMessage = () => {
      return new Promise<{ detected: boolean; version: string | null }>((resolve) => {
        const messageId = `extension-check-${Date.now()}-${Math.random()}`
        let resolved = false
        let timeoutId: NodeJS.Timeout | null = null

        const handleMessage = (event: MessageEvent) => {
          // Security: Only accept messages from same origin
          if (event.origin !== window.location.origin) {
            return
          }

          const { type, messageId: responseId, version } = event.data || {}

          // Check if this is a response to our detection message
          // The extension responds with SRT_AUTH_TOKEN_RESPONSE even if no token is available
          if (type === 'SRT_AUTH_TOKEN_RESPONSE' && responseId === messageId) {
            if (!resolved) {
              resolved = true
              cleanup()
              // Return both detection status and version
              resolve({ detected: true, version: version || null })
            }
          }
        }

        const cleanup = () => {
          if (messageListener) {
            window.removeEventListener('message', messageListener)
            messageListener = null
          }
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
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
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true
            cleanup()
            resolve({ detected: false, version: null })
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

    // Run detection with retries for edge cases (old extensions that might not respond immediately)
    const runDetection = async (retryCount = 0) => {
      try {
        // Try message-based detection first
        const result = await detectViaMessage()
        
        if (result.detected) {
          isDetectedRef.current = true
          setIsExtensionInstalled(true)
          setExtensionVersion(result.version)
        } else {
          // If no response, try again after a delay (for edge cases where extension is slow to respond)
          // This helps catch old extensions that might take longer to initialize
          if (retryCount < 2) {
            setTimeout(() => runDetection(retryCount + 1), 1000)
            return
          }
          
          // After retries, check for markers
          const markerDetected = detectViaMarkers()
          setIsExtensionInstalled(markerDetected)
          if (!markerDetected) {
            setExtensionVersion(null)
          }
        }
      } catch (error) {
        console.debug('[Extension Detection] Error:', error)
        // On error, still try one more time after delay (edge case handling)
        if (retryCount < 1) {
          setTimeout(() => runDetection(retryCount + 1), 1000)
        } else {
          setIsExtensionInstalled(false)
          setExtensionVersion(null)
        }
      }
    }

    // Small delay to ensure page is fully loaded
    const detectionTimeout = setTimeout(() => runDetection(0), 500)
    
    // Periodic re-check for edge cases (extensions that load slowly or don't respond immediately)
    // This helps catch old extensions that might take longer to initialize
    let periodicCheckInterval: NodeJS.Timeout | null = null
    let checkCount = 0
    const maxChecks = 3 // Check up to 3 times (15 seconds total)
    
    periodicCheckInterval = setInterval(() => {
      checkCount++
      // Only re-check if we haven't detected the extension yet and haven't exceeded max checks
      if (!isDetectedRef.current && checkCount <= maxChecks) {
        runDetection(0)
      } else if (checkCount > maxChecks) {
        // Stop checking after max attempts
        if (periodicCheckInterval) {
          clearInterval(periodicCheckInterval)
        }
      }
    }, 5000) // Check every 5 seconds

    // Cleanup
    return () => {
      if (detectionTimeout) {
        clearTimeout(detectionTimeout)
      }
      if (periodicCheckInterval) {
        clearInterval(periodicCheckInterval)
      }
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
    }
  }, [])

  // Return detection result with version information
  return {
    isExtensionInstalled,
    extensionVersion
  }
}
